/**
 * المنزلة وناسها — Global App State
 * Simple reactive state manager (no framework dependency)
 */

class AppState {
  constructor() {
    this._state = {
      user: null,
      authLoading: true,
      settings: null,
      categories: null,
      currentPage: null,
    };
    this._listeners = {};
  }

  get(key) {
    return this._state[key];
  }

  set(key, value) {
    const prev = this._state[key];
    this._state[key] = value;

    if (prev !== value) {
      this._notify(key, value, prev);
    }
  }

  update(key, updater) {
    const current = this._state[key];
    this.set(key, updater(current));
  }

  /**
   * Subscribe to state changes for a specific key.
   * Returns an unsubscribe function.
   */
  subscribe(key, callback) {
    if (!this._listeners[key]) {
      this._listeners[key] = new Set();
    }
    this._listeners[key].add(callback);

    return () => {
      this._listeners[key]?.delete(callback);
    };
  }

  _notify(key, newVal, oldVal) {
    this._listeners[key]?.forEach(cb => {
      try { cb(newVal, oldVal); } catch(e) { console.error('[State] Listener error:', e); }
    });
  }

  /**
   * Get full state snapshot (for debugging)
   */
  snapshot() {
    return { ...this._state };
  }
}

export const appState = new AppState();
