/**
 * Workflow Engine — orchestrates multi-agent workflows.
 * Supports sequential steps, parallel steps, dependencies, and delays.
 */
import { loadRunner } from './runner-registry.js';
import eventBus from './event-bus.js';
import { log } from './agent-base.js';

export async function executeWorkflow(workflow, options = {}) {
  const { name, steps } = workflow;
  log('workflow', `Starting workflow: "${name}" (${steps.length} steps)`);

  const results = {};
  const startTime = Date.now();

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];

    if (step.dependsOn && !results[step.dependsOn]) {
      log('workflow', `Skipping step ${i + 1}: dependency "${step.dependsOn}" not completed`);
      continue;
    }

    if (step.delay) {
      const delayMs = parseDelay(step.delay);
      log('workflow', `Waiting ${step.delay} before step ${i + 1}...`);
      await new Promise(r => setTimeout(r, delayMs));
    }

    const stepOptions = {
      ...options,
      ...(step.options || {}),
      _workflow: name,
      _previousResults: results,
    };

    if (step.parallel && step.agents) {
      log('workflow', `Step ${i + 1}: Running ${step.agents.length} agents in parallel`);
      const promises = step.agents.map(async (agentType) => {
        try {
          const runFn = await loadRunner(agentType);
          const result = await runFn(stepOptions);
          results[agentType] = result;
          return { agentType, success: true, result };
        } catch (error) {
          results[agentType] = { error: error.message };
          return { agentType, success: false, error: error.message };
        }
      });
      await Promise.allSettled(promises);
    } else if (step.agent) {
      log('workflow', `Step ${i + 1}: Running "${step.agent}"`);
      try {
        const runFn = await loadRunner(step.agent);
        const result = await runFn(stepOptions);
        results[step.agent] = result;
      } catch (error) {
        results[step.agent] = { error: error.message };
        log('workflow', `Step ${i + 1} failed: ${error.message}`);
        if (!step.continueOnError) {
          log('workflow', `Workflow "${name}" aborted at step ${i + 1}`);
          break;
        }
      }
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  const successCount = Object.values(results).filter(r => !r?.error).length;
  log('workflow', `Workflow "${name}" completed in ${duration}s — ${successCount}/${steps.length} steps succeeded`);

  eventBus.emit('workflow:completed', { name, results, duration });

  return { name, results, duration, successCount, totalSteps: steps.length };
}

function parseDelay(delayStr) {
  const match = delayStr.match(/^(\d+)(s|m|h)$/);
  if (!match) return 0;
  const val = parseInt(match[1]);
  switch (match[2]) {
    case 's': return val * 1000;
    case 'm': return val * 60000;
    case 'h': return val * 3600000;
    default: return 0;
  }
}

export default { executeWorkflow };
