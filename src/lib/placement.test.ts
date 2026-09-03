import { describe, expect, it } from 'vitest'
import { computePlacement, EDGE_PAD, MENU_MARGIN, pinsRight, placeAbove, type PlacementInput } from './placement'

/* The menu's geometry. Mutation testing found this was the least-verified part of
 * the whole system: 60 surviving mutants on eight lines, because jsdom returns
 * zeros from getBoundingClientRect() and no component test could tell the
 * outcomes apart. Feeding the measurements in directly is what makes it checkable. */

const VIEWPORT = { width: 1000, height: 800 }

/** A trigger somewhere comfortable, unless a case moves it. */
const at = (over: Partial<PlacementInput> = {}): PlacementInput => ({
  trigger: { top: 300, bottom: 330, left: 400, right: 500, width: 100 , height: 30 },
  menu: { height: 200, width: 160 },
  viewport: VIEWPORT,
  align: 'start',
  isRtl: false,
  ...over,
})

describe('placeAbove', () => {
  it('opens downwards when the menu fits below', () => {
    expect(placeAbove(at())).toBe(false)
  })

  it('flips up when it does not fit below and there is more room above', () => {
    // trigger near the bottom: 800 - 730 - 8 = 62 below, 700 above
    expect(placeAbove(at({ trigger: { top: 700, bottom: 730, left: 400, right: 500, width: 100 , height: 30 } }))).toBe(true)
  })

  it('stays down when it fits nowhere but below is still the roomier side', () => {
    // A tall menu in a short viewport: flipping would only make it worse.
    const input = at({
      menu: { height: 2000, width: 160 },
      trigger: { top: 100, bottom: 130, left: 400, right: 500, width: 100 , height: 30 },
    })
    expect(placeAbove(input)).toBe(false)
  })

  it('is decided by free space, not by the menu being tall on its own', () => {
    const roomy = at({ menu: { height: 400, width: 160 } })
    expect(placeAbove(roomy)).toBe(false)
  })
})

describe('pinsRight', () => {
  it('follows the requested alignment when the menu fits either way', () => {
    expect(pinsRight(at({ align: 'start' }))).toBe(false)
    expect(pinsRight(at({ align: 'end' }))).toBe(true)
  })

  it('mirrors in RTL', () => {
    expect(pinsRight(at({ align: 'start', isRtl: true }))).toBe(true)
    expect(pinsRight(at({ align: 'end', isRtl: true }))).toBe(false)
  })

  it('flips to the right when a left-aligned menu would run off the right edge', () => {
    const input = at({
      align: 'start',
      trigger: { top: 300, bottom: 330, left: 900, right: 980, width: 80 , height: 30 },
      menu: { height: 200, width: 300 },
    })
    expect(pinsRight(input)).toBe(true)
  })

  it('flips to the left when a right-aligned menu would run off the left edge', () => {
    const input = at({
      align: 'end',
      trigger: { top: 300, bottom: 330, left: 20, right: 100, width: 80 , height: 30 },
      menu: { height: 200, width: 300 },
    })
    expect(pinsRight(input)).toBe(false)
  })

  it('does not guess before the menu has been measured', () => {
    // width 0 = not mounted yet. Flipping on a guess makes the menu jump one
    // frame later, which is worse than opening where it was asked to.
    const unmeasured = at({ align: 'start', menu: { height: 0, width: 0 }, trigger: { top: 300, bottom: 330, left: 995, right: 1000, width: 5 , height: 30 } })
    expect(pinsRight(unmeasured)).toBe(false)
    expect(pinsRight({ ...unmeasured, align: 'end' })).toBe(true)
  })
})

describe('computePlacement', () => {
  it('sits under the trigger with the margin, and offers the room below', () => {
    const p = computePlacement(at())
    expect(p.top).toBe(330 + MENU_MARGIN)
    expect(p.left).toBe(400)
    expect(p.right).toBeUndefined()
    expect(p.maxHeight).toBe(800 - 330 - EDGE_PAD - MENU_MARGIN)
  })

  it('when flipped, sits above the trigger and offers the room above', () => {
    const p = computePlacement(at({ trigger: { top: 700, bottom: 730, left: 400, right: 500, width: 100 , height: 30 } }))
    expect(p.top).toBe(700 - 200 - MENU_MARGIN)
    expect(p.maxHeight).toBe(700 - EDGE_PAD - MENU_MARGIN)
  })

  it('never places the menu past the top edge', () => {
    // A menu taller than the space above would compute a negative top.
    const p = computePlacement(at({
      menu: { height: 600, width: 160 },
      trigger: { top: 500, bottom: 530, left: 400, right: 500, width: 100 , height: 30 },
    }))
    expect(p.top).toBe(EDGE_PAD)
  })

  it('keeps the padding when the trigger is against an edge', () => {
    const left = computePlacement(at({ trigger: { top: 300, bottom: 330, left: 0, right: 80, width: 80 , height: 30 } }))
    expect(left.left).toBe(EDGE_PAD)

    const right = computePlacement(at({ align: 'end', trigger: { top: 300, bottom: 330, left: 920, right: 1000, width: 80 , height: 30 } }))
    expect(right.right).toBe(EDGE_PAD)
  })

  it('matches the trigger width only when asked, and picks the right property', () => {
    expect(computePlacement(at()).width).toBeUndefined()
    expect(computePlacement(at({ matchTriggerWidth: true })).width).toBe(100)
    expect(computePlacement(at({ matchTriggerWidth: true })).minWidth).toBeUndefined()
    expect(computePlacement(at({ matchTriggerWidth: 'min' })).minWidth).toBe(100)
    expect(computePlacement(at({ matchTriggerWidth: 'min' })).width).toBeUndefined()
  })

  it('anchors from the correct side once pinned right', () => {
    const p = computePlacement(at({ align: 'end' }))
    expect(p.right).toBe(VIEWPORT.width - 500)
    expect(p.left).toBeUndefined()
  })
})
