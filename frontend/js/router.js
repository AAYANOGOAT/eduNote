/**
 * router.js – Minimal hash-based SPA router
 */
export class Router {
  constructor() {
    this.routes = {};
    window.addEventListener('hashchange', () => this.resolve());
  }

  /** Register a route handler */
  on(path, handler) {
    this.routes[path] = handler;
    return this;                    // allow chaining
  }

  /** Resolve the current hash to a route handler */
  resolve() {
    const hash = window.location.hash.slice(1) || '/login';

    /* Exact match first */
    if (this.routes[hash]) { this.routes[hash](); return; }

    /* Try parameterised match (:id etc.) */
    for (const [path, handler] of Object.entries(this.routes)) {
      if (!path.includes(':')) continue;
      const regex = new RegExp(
        '^' + path.replace(/:([^/]+)/g, '([^/]+)') + '$'
      );
      const match = hash.match(regex);
      if (match) { handler(...match.slice(1)); return; }
    }

    /* Fallback */
    this.navigate('/login');
  }

  /** Navigate to a hash path */
  navigate(path) {
    window.location.hash = `#${path}`;
  }

  /** Bootstrap */
  start() {
    this.resolve();
  }
}
