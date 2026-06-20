/**
 * In-memory dedup for AI usage recording.
 * Prevents double-counting when both proxy-ai.js and ai-router-webhook.js
 * fire for the same API request.
 *
 * Dedup key: `${apiKeyId}:${endpoint}:${statusCode}:${minuteBucket}`
 * where minuteBucket = Math.floor(timestamp / 60000)
 */

const recorded = new Map(); // dedupKey → timestamp

/**
 * Mark a request as recorded.
 * @param {string} dedupKey
 */
export function markRecorded(dedupKey) {
  recorded.set(dedupKey, Date.now());
}

/**
 * Check if a request was already recorded.
 * @param {string} dedupKey
 * @returns {boolean}
 */
export function wasRecorded(dedupKey) {
  return recorded.has(dedupKey);
}

/**
 * Generate a dedup key from request metadata.
 * Requests within the same minute with the same key/endpoint/status are considered duplicates.
 */
export function makeDedupKey(apiKeyId, endpoint, statusCode, timestamp) {
  return `${apiKeyId}:${endpoint || 'unknown'}:${statusCode || 0}:${Math.floor((timestamp || Date.now()) / 60000)}`;
}

// Cleanup old entries every 60 seconds
setInterval(() => {
  const cutoff = Date.now() - 120_000; // 2 minutes
  for (const [key, ts] of recorded) {
    if (ts < cutoff) recorded.delete(key);
  }
}, 60_000).unref(); // .unref() so it doesn't keep the process alive
