/* Where the menu goes. Pure arithmetic, deliberately separated from the
 * component.
 *
 * Why it lives here instead of inline: jsdom has no layout engine, so every
 * getBoundingClientRect() in a test returns zeros and the whole placement branch
 * runs on nothing. Mutation testing made that visible — 60 of the 139 surviving
 * mutants in Dropdown.tsx sat on these lines, meaning the flip-above, the
 * edge-pinning and the RTL mirror were not verified by anything. Taking the
 * measurements as arguments makes them testable without a browser. */

/* THE ONE READ OF THE DOCUMENT'S DIRECTION.
 *
 * Three layers asked `document.documentElement.dir === 'rtl'` for themselves,
 * which is three chances to ask a slightly different question — and the whole
 * reason this file exists is that geometry answered inline is geometry nobody
 * tests. It lives here rather than in a component because every caller is about
 * to hand the answer to computePlacement below. (2026-09-03) */
export const isRtl = () => document.documentElement.dir === 'rtl'

export const MENU_MARGIN = 4
export const EDGE_PAD = 8

export interface Box {
  top: number
  bottom: number
  left: number
  right: number
  width: number
  /* Carried because a layer that sits BESIDE its trigger centres on it, and
   * bottom - top is the caller doing arithmetic the reader already did.
   * (2026-09-03, when <Tooltip> joined the shared read.) */
  height: number
}

export interface PlacementInput {
  /** The trigger, in viewport coordinates. */
  trigger: Box
  /** The menu's NATURAL size (scrollHeight/scrollWidth, before any clamp). */
  menu: { height: number; width: number }
  viewport: { width: number; height: number }
  align: 'start' | 'end'
  isRtl: boolean
  matchTriggerWidth?: boolean | 'min'
  /* Which side the caller WANTS. A menu wants below and flips up when it has to;
   * a popover may be asked for above. Either way the flip rule underneath is the
   * same one — go to the other side only when this one does not fit and the
   * other genuinely has more room — which is why the preference is an input here
   * rather than a second copy of the arithmetic in a component. (2026-09-03) */
  prefer?: 'below' | 'above'
}

export interface Placement {
  top: number
  left?: number
  right?: number
  maxHeight: number
  width?: number
  minWidth?: number
}

/** Does the menu have to open upwards? Only when it does not fit below AND there
 *  is genuinely more room above — otherwise flipping just moves the problem. */
export function placeAbove(input: Pick<PlacementInput, 'trigger' | 'menu' | 'viewport' | 'prefer'>): boolean {
  const { spaceAbove, spaceBelow } = freeSpace(input)
  if (input.prefer === 'above') return !(input.menu.height > spaceAbove && spaceBelow > spaceAbove)
  return input.menu.height > spaceBelow && spaceAbove > spaceBelow
}

function freeSpace({ trigger, viewport }: Pick<PlacementInput, 'trigger' | 'viewport'>) {
  return {
    spaceBelow: viewport.height - trigger.bottom - EDGE_PAD,
    spaceAbove: trigger.top - EDGE_PAD,
  }
}

/** Which edge the menu hangs from. Starts from the requested alignment (mirrored
 *  in RTL) and flips only when that side would run off the viewport. A menu of
 *  unknown width (0, not measured yet) never flips: guessing would make the menu
 *  jump on the frame after it mounts. */
export function pinsRight(input: Pick<PlacementInput, 'trigger' | 'menu' | 'viewport' | 'align' | 'isRtl'>): boolean {
  const { trigger, menu, viewport, align, isRtl } = input
  const wanted = align === 'end' ? !isRtl : isRtl
  if (menu.width <= 0) return wanted
  if (wanted) return trigger.right - menu.width >= EDGE_PAD
  return trigger.left + menu.width > viewport.width - EDGE_PAD
}

/** The final inline position for the menu. */
export function computePlacement(input: PlacementInput): Placement {
  const { trigger, menu, viewport, matchTriggerWidth } = input
  const above = placeAbove(input)
  const { spaceAbove, spaceBelow } = freeSpace(input)

  const top = above
    ? Math.max(EDGE_PAD, trigger.top - menu.height - MENU_MARGIN)
    : trigger.bottom + MENU_MARGIN
  const maxHeight = (above ? spaceAbove : spaceBelow) - MENU_MARGIN

  const width = matchTriggerWidth === true ? trigger.width : undefined
  const minWidth = matchTriggerWidth === 'min' ? trigger.width : undefined

  return pinsRight(input)
    ? { top, right: Math.max(EDGE_PAD, viewport.width - trigger.right), maxHeight, width, minWidth }
    : { top, left: Math.max(EDGE_PAD, trigger.left), maxHeight, width, minWidth }
}

/* READING THE PAGE, once, for everybody who anchors something to something.
 *
 * The arithmetic above takes numbers so it can be tested without a browser, and
 * that split is right — but it left every caller doing the same three DOM reads
 * by hand: the trigger's rect, the layer's size, the viewport. Four parts did,
 * and lint:mechanism reported them as one behaviour written four times for as
 * long as it has existed. This is that half, in one place.
 *
 * `natural` is the one real difference between the callers and it stays visible
 * as a flag rather than as four silent choices: a menu that clamps its own
 * height has to be measured by scrollHeight, because offsetHeight is the size
 * AFTER the clamp and reads as "it fits" for ever. A layer that does not clamp
 * is measured as rendered. (2026-09-03) */
export function readAnchor(
  trigger: Element | null,
  layer: { scrollHeight: number; scrollWidth: number; offsetHeight: number; offsetWidth: number } | null,
  { natural = false } = {},
): Pick<PlacementInput, 'trigger' | 'menu' | 'viewport' | 'isRtl'> | null {
  if (!trigger) return null
  const r = trigger.getBoundingClientRect()
  return {
    trigger: { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height },
    menu: natural
      ? { height: layer?.scrollHeight ?? 0, width: layer?.scrollWidth ?? 0 }
      : { height: layer?.offsetHeight ?? 0, width: layer?.offsetWidth ?? 0 },
    viewport: { width: window.innerWidth, height: window.innerHeight },
    isRtl: isRtl(),
  }
}
