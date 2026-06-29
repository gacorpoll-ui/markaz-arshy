/**
 * Agent Event Bus — in-process EventEmitter for cross-agent coordination.
 * Agents emit events on completion; other agents subscribe to react.
 */
import { EventEmitter } from 'events';

const bus = new EventEmitter();
bus.setMaxListeners(50);

export const EVENTS = {
  AGENT_COMPLETED: 'agent:completed',
  AGENT_FAILED:    'agent:failed',
  CONTENT_GENERATED: 'content:generated',
  REVENUE_MILESTONE: 'revenue:milestone',
  ORDER_CREATED:   'order:created',
};

export function emit(event, data) {
  bus.emit(event, { ...data, _timestamp: Date.now() });
}

export function on(event, handler) {
  bus.on(event, handler);
}

export function once(event, handler) {
  bus.once(event, handler);
}

export function off(event, handler) {
  bus.off(event, handler);
}

export default { emit, on, once, off, EVENTS };
