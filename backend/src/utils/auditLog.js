import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUDIT_LOG_PATH = path.join(__dirname, '..', 'logs', 'admin-audit.log');

/**
 * Log an admin action for audit trail.
 * Writes to a structured JSONL log file — no database schema changes needed.
 * @param {number} adminId - The admin user performing the action
 * @param {string} action - Action identifier (e.g. 'CONFIRM_DEPOSIT', 'CHANGE_ROLE')
 * @param {string|number|null} targetId - ID of the affected entity
 * @param {object|null} details - Additional context (before/after state)
 */
export async function logAdminAction(adminId, action, targetId = null, details = null) {
  try {
    const entry = {
      timestamp: new Date().toISOString(),
      adminId,
      action,
      targetId: targetId != null ? String(targetId) : null,
      details,
    };

    // Ensure logs directory exists
    const dir = path.dirname(AUDIT_LOG_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.appendFileSync(AUDIT_LOG_PATH, JSON.stringify(entry) + '\n');
  } catch (err) {
    // Don't let audit logging failure break the main operation
    console.error('[AUDIT] Failed to log admin action:', err.message);
  }
}
