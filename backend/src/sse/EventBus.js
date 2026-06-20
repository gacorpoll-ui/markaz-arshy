import { EventEmitter } from 'events';

/**
 * In-process EventBus for broadcasting AI usage events to SSE clients.
 * Single-process Express app — no Redis needed.
 *
 * Events:
 *   'usage:recorded'  → { userId, id, model, tokens, cost, ... }
 *   'balance:updated'  → { userId, keyId, newBalance }
 */
class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(200); // Allow many SSE connections
  }

  /**
   * Broadcast that a new AI usage was recorded.
   * @param {number} userId - The user who owns the API key
   * @param {object} usageData - Usage details (id, model, tokens, cost, etc.)
   */
  emitUsage(userId, usageData) {
    this.emit('usage:recorded', { userId, ...usageData });
  }

  /**
   * Broadcast that an API key's credit balance was updated.
   * @param {number} userId - The user who owns the API key
   * @param {number} keyId - The API key ID
   * @param {number} newBalance - New credits balance after deduction
   */
  emitBalanceUpdate(userId, keyId, newBalance) {
    this.emit('balance:updated', { userId, keyId, newBalance });
  }
}

const eventBus = new EventBus();
export default eventBus;
