// Runtime compatibility entrypoint.
// The readable source is authoritative; re-export it directly so production
// never executes a stale/generated bundle containing duplicate declarations.
export * from './db.pretty.js';
