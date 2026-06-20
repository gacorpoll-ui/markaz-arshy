import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom React hook for SSE (Server-Sent Events) connection to the AI usage stream.
 * Features: auto-reconnect with exponential backoff, cleanup on unmount,
 * stable callback refs to prevent unnecessary reconnections.
 *
 * @param {object} options
 * @param {string} options.token - JWT auth token
 * @param {function} options.onUsage - Callback when new usage event arrives
 * @param {function} options.onBalance - Callback when balance update event arrives
 * @param {function} options.onConnectionChange - Callback with connection state
 */
export function useAISSE({ token, onUsage, onBalance, onConnectionChange }) {
  const eventSourceRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectDelayRef = useRef(1000);
  const mountedRef = useRef(true);
  // Store callbacks in refs to avoid reconnecting when callbacks change
  const callbacksRef = useRef({ onUsage, onBalance, onConnectionChange });

  // Keep callbacks ref fresh without causing reconnects
  useEffect(() => {
    callbacksRef.current = { onUsage, onBalance, onConnectionChange };
  }, [onUsage, onBalance, onConnectionChange]);

  const connect = useCallback(() => {
    if (!token || !mountedRef.current) return;

    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    callbacksRef.current.onConnectionChange?.('connecting');

    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    const url = `${baseUrl}/api/ai-router/events/stream?token=${encodeURIComponent(token)}`;

    const es = new EventSource(url);

    es.addEventListener('usage', (e) => {
      try {
        const data = JSON.parse(e.data);
        callbacksRef.current.onUsage?.(data);
        reconnectDelayRef.current = 1000; // Reset backoff on successful message
      } catch {}
    });

    es.addEventListener('balance', (e) => {
      try {
        const data = JSON.parse(e.data);
        callbacksRef.current.onBalance?.(data);
      } catch {}
    });

    es.onopen = () => {
      callbacksRef.current.onConnectionChange?.('connected');
      reconnectDelayRef.current = 1000;
    };

    es.onerror = () => {
      es.close();
      callbacksRef.current.onConnectionChange?.('disconnected');
      if (mountedRef.current) {
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 2, 30000);
          connect();
        }, reconnectDelayRef.current);
      }
    };

    eventSourceRef.current = es;
  }, [token]); // Only reconnect when token changes

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [connect]);
}
