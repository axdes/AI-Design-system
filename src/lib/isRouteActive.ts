/**
 * Is this nav route the one the user is currently inside?
 *
 * Every app was answering this with `pathname === route`, which is right on the
 * list screen and wrong the moment you open something: standing on
 * `/discovery/dg` the "Discovery" item went dark, so the sidebar claimed you were
 * nowhere. The design system's own shell got it right only because it uses
 * react-router's `<NavLink>`, whose `isActive` already covers descendants — the
 * two apps that build their menu from data had no such help.
 *
 * The `route + '/'` guard is the whole subtlety, and it is why this is tested:
 * a bare `startsWith` lights `/discovery` while you are on `/discovery-types`,
 * and those two are siblings in a real menu, not parent and child.
 */
export function isRouteActive(pathname: string, route: string): boolean {
  /* Root is only ever itself; a prefix test would make it match every page. */
  if (route === '/') return pathname === '/'
  const clean = route.endsWith('/') ? route.slice(0, -1) : route
  return pathname === clean || pathname.startsWith(`${clean}/`)
}
