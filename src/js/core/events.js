/**
 * المنزلة وناسها — Event Bus
 * Simple pub/sub event system for decoupled communication
 */

const _listeners = new Map();

/**
 * Subscribe to an event
 * @param {string} event
 * @param {Function} handler
 * @returns {Function} unsubscribe function
 */
export function on(event, handler) {
  if (!_listeners.has(event)) {
    _listeners.set(event, new Set());
  }
  _listeners.get(event).add(handler);

  return () => off(event, handler);
}

/**
 * Unsubscribe from an event
 */
export function off(event, handler) {
  _listeners.get(event)?.delete(handler);
}

/**
 * Emit an event with optional data
 */
export function emit(event, data = undefined) {
  _listeners.get(event)?.forEach(handler => {
    try { handler(data); } catch(e) { console.error(`[Events] Error in handler for "${event}":`, e); }
  });
}

/**
 * Subscribe to an event, auto-unsubscribe after first call
 */
export function once(event, handler) {
  const unsub = on(event, (data) => {
    handler(data);
    unsub();
  });
  return unsub;
}

/**
 * Remove all listeners for an event (or all events)
 */
export function clear(event = null) {
  if (event) {
    _listeners.delete(event);
  } else {
    _listeners.clear();
  }
}
