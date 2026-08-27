/**
 * المنزلة وناسها — Client-Side SPA Router
 * Hash-based routing (#/path) with params and guards support
 */

import { appState } from './state.js';
import { emit } from './events.js';
import { waitForAuth, isAdmin } from './auth.js';

const _routes = new Map();
let _notFoundHandler = null;
let _beforeEach = null;

/**
 * Route definition:
 * { path, component, meta: { requiresAuth, requiresAdmin } }
 */

/**
 * Register a route
 */
export function route(path, handler, meta = {}) {
  _routes.set(path, { handler, meta, path });
}

/**
 * Set 404 handler
 */
export function notFound(handler) {
  _notFoundHandler = handler;
}

/**
 * Register a global before-each guard
 */
export function beforeEach(guard) {
  _beforeEach = guard;
}

/**
 * Navigate to a path (programmatic)
 */
export function navigate(path) {
  window.location.hash = path.startsWith('#') ? path : `#${path}`;
}

/**
 * Get current hash path
 */
export function getCurrentPath() {
  const hash = window.location.hash || '#/';
  return hash.startsWith('#') ? hash.slice(1) : hash;
}

/**
 * Parse path into route match
 * Supports: /path, /path/:param, /path/:param/sub/:param2
 */
function matchRoute(path) {
  for (const [pattern, routeDef] of _routes) {
    const paramNames = [];
    // Convert route pattern to regex
    const regexStr = '^' + pattern
      .replace(/:[^/]+/g, (match) => {
        paramNames.push(match.slice(1));
        return '([^/]+)';
      })
      .replace(/\//g, '\\/') + '(?:\\?.*)?$';

    const regex = new RegExp(regexStr);
    const match = path.match(regex);

    if (match) {
      const params = {};
      paramNames.forEach((name, i) => {
        params[name] = decodeURIComponent(match[i + 1]);
      });

      // Parse query string
      const query = {};
      const qIdx = path.indexOf('?');
      if (qIdx !== -1) {
        new URLSearchParams(path.slice(qIdx + 1)).forEach((v, k) => {
          query[k] = v;
        });
      }

      return { ...routeDef, params, query };
    }
  }
  return null;
}

/**
 * Resolve and render current route
 */
async function resolveRoute() {
  const path = getCurrentPath() || '/';

  const matched = matchRoute(path);

  if (!matched) {
    emit('router:notFound', { path });
    _notFoundHandler?.({ path, params: {}, query: {} });
    return;
  }

  const { handler, meta, params, query } = matched;

  // Wait for auth to be ready before checking guards
  const user = await waitForAuth();

  // Auth guard
  if (meta.requiresAuth && !user) {
    navigate('/login');
    return;
  }

  // Admin guard
  if (meta.requiresAdmin && !isAdmin(user)) {
    navigate('/');
    return;
  }

  // Custom before-each guard
  if (_beforeEach) {
    const shouldContinue = await _beforeEach({ path, params, query, meta, user });
    if (shouldContinue === false) return;
    if (typeof shouldContinue === 'string') {
      navigate(shouldContinue);
      return;
    }
  }

  // Update state
  appState.set('currentPage', { path, params, query, meta });
  emit('router:navigated', { path, params, query, meta });

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'instant' });

  // Execute handler
  try {
    await handler({ params, query, user });
  } catch (err) {
    console.error('[Router] Handler error:', err);
  }
}

/**
 * Initialize router — must be called once
 */
export function initRouter() {
  window.addEventListener('hashchange', resolveRoute);
  // Resolve initial route
  resolveRoute();
}

/**
 * Get URL for a named path
 */
export function buildUrl(path, params = {}) {
  let url = path;
  Object.entries(params).forEach(([key, val]) => {
    url = url.replace(`:${key}`, encodeURIComponent(val));
  });
  return `#${url}`;
}

/**
 * Link element to route (adds active class when matched)
 */
export function linkTo(el, path) {
  el.href = buildUrl(path);
  el.addEventListener('click', (e) => {
    e.preventDefault();
    navigate(path);
  });

  // Update active state
  const updateActive = () => {
    const current = getCurrentPath();
    el.classList.toggle('active', current === path);
  };

  window.addEventListener('hashchange', updateActive);
  updateActive();
}
