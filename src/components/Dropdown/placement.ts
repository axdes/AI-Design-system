/* Where the menu goes. Pure arithmetic, deliberately separated from the
 * component.
 *
 * Why it lives here instead of inline: jsdom has no layout engine, so every
 * getBoundingClientRect() in a test returns zeros and the whole placement branch
 * runs on nothing. Mutation testing made that visible — 60 of the 139 surviving
 * mutants in Dropdown.tsx sat on these lines, meaning the flip-above, the
 * edge-pinning and the RTL mirror were not verified by anything. Taking the
 * measurements as arguments makes them testable without a browser. */

export const MENU_MARGIN = 4
export const EDGE_PAD = 8

export interface Box {
  top: number
  bottom: number
  left: number
  right: number
  width: number
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
export function placeAbove(input: Pick<PlacementInput, 'trigger' | 'menu' | 'viewport'>): boolean {
  const { spaceAbove, spaceBelow } = freeSpace(input)
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
