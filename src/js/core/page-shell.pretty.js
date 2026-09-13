// Pretty entrypoint intentionally delegates to the canonical page shell.
// This prevents minification/generation from restoring an older More-menu implementation.
export { initPage, waitForAuth, isAdmin } from './page-shell.js';
