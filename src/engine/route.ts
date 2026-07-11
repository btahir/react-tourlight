/**
 * Route matching helpers for multi-page tours.
 *
 * These intentionally do NOT depend on any router. Route steps are compared
 * against `window.location.pathname` with a small, framework-agnostic matcher.
 * Consumers who need richer matching can supply their own `isRouteActive`
 * override on the provider (or to the headless `useTour` hook).
 */

/**
 * Returns the current pathname, or `'/'` when running outside a browser
 * (SSR / non-DOM environments).
 */
export function getCurrentPath(): string {
  if (typeof window === 'undefined' || !window.location) return '/'
  return window.location.pathname || '/'
}

/** Removes a trailing slash (except for the root path). */
function normalize(path: string): string {
  if (path.length > 1 && path.endsWith('/')) {
    return path.slice(0, -1)
  }
  return path
}

/**
 * Determines whether a step's `route` is active for the given pathname.
 *
 * Supported patterns:
 * - **Exact** — `'/settings'` matches only `/settings`.
 * - **Trailing wildcard** — `'/app/*'` matches `/app` and anything under it;
 *   `'/app*'` matches any pathname starting with `/app`.
 * - **Dynamic segments** — `'/users/:id'` matches `/users/42` (segment counts
 *   must be equal).
 */
export function isRouteActive(route: string, pathname: string): boolean {
  const r = normalize(route)
  const p = normalize(pathname)

  if (r === p) return true

  // '/app/*' — prefix match on a path boundary
  if (r.endsWith('/*')) {
    const base = normalize(r.slice(0, -2))
    return p === base || p.startsWith(`${base}/`)
  }

  // '/app*' — raw prefix match
  if (r.endsWith('*')) {
    return p.startsWith(r.slice(0, -1))
  }

  // '/users/:id' — dynamic segments
  if (r.includes(':')) {
    const rSeg = r.split('/').filter(Boolean)
    const pSeg = p.split('/').filter(Boolean)
    if (rSeg.length !== pSeg.length) return false
    return rSeg.every((seg, i) => seg.startsWith(':') || seg === pSeg[i])
  }

  return false
}
