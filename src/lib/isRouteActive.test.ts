import { describe, expect, it } from 'vitest'
import { isRouteActive } from './isRouteActive'

/* The bug this exists to prevent, and the bug the obvious fix would introduce.
 * Both are one character apart, and neither shows up as an error anywhere: the
 * sidebar just claims you are somewhere you are not. */

describe('the route you are actually on', () => {
  it('matches exactly', () => {
    expect(isRouteActive('/discovery', '/discovery')).toBe(true)
  })

  it('matches a screen nested under it', () => {
    // Standing on a project, "Discovery" must stay lit. This is what was broken.
    expect(isRouteActive('/discovery/dg', '/discovery')).toBe(true)
    expect(isRouteActive('/workshops/abc123', '/workshops')).toBe(true)
    expect(isRouteActive('/transcripts/t/x1', '/transcripts')).toBe(true)
  })

  it('does NOT match a sibling that merely starts the same way', () => {
    /* `/discovery` and `/discovery-types` are two separate menu items in a real
     * app. A bare startsWith lights both, which is the same lie in the other
     * direction. */
    expect(isRouteActive('/discovery-types', '/discovery')).toBe(false)
    expect(isRouteActive('/discovery-types/default', '/discovery')).toBe(false)
    expect(isRouteActive('/discovery', '/discovery-types')).toBe(false)
  })

  it('does not match an unrelated route', () => {
    expect(isRouteActive('/settings', '/discovery')).toBe(false)
  })
})

describe('edges', () => {
  it('root only matches root', () => {
    // A prefix test would make "/" the active item on every screen.
    expect(isRouteActive('/', '/')).toBe(true)
    expect(isRouteActive('/discovery', '/')).toBe(false)
  })

  it('tolerates a trailing slash on either side', () => {
    expect(isRouteActive('/discovery/', '/discovery')).toBe(true)
    expect(isRouteActive('/discovery', '/discovery/')).toBe(true)
    expect(isRouteActive('/discovery/dg', '/discovery/')).toBe(true)
  })

  it('is case sensitive, because paths are', () => {
    expect(isRouteActive('/Discovery', '/discovery')).toBe(false)
  })
})
