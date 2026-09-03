import { useEffect, useRef } from 'react'
import { useLatest } from './useLatest'

/**
 * FOCUS GOES INTO A LAYER WHEN IT OPENS, AND COMES BACK WHEN IT CLOSES.
 *
 * Both halves, because the second one is the half that gets forgotten.
 * <Dropdown> had written both by hand; <CommandPalette> had written the first
 * and not the second, so closing the palette with Escape left focus on the
 * document body and dropped a keyboard user at the top of the page (SC 2.4.3).
 * Nothing in the gate could see it — the markup is correct either way — and it
 * was found by putting the two side by side, which is what lint:mechanism is
 * for. (2026-09-03)
 *
 * The layer is portalled and mounts a tick after `open`, so the target is asked
 * for on the next frame rather than in the effect: a ref that does not exist yet
 * reads as null and the focus lands nowhere.
 *
 * `ready` is for a caller whose target appears later still — a menu that has to
 * measure itself before it has items to focus.
 */
export function useFocusInside({ open, ready = true, target }: {
  open: boolean
  ready?: boolean
  /** The element that should hold focus while the layer is open. */
  target: () => HTMLElement | null
}) {
  const returnTo = useRef<HTMLElement | null>(null)
  /* The caller writes `target` as a closure, so it is a new function on every
   * render. Depending on it re-ran this effect after every keystroke and put
   * focus back on the first row — the arrow keys stopped working, which is how
   * it was found (2026-09-03). The effect depends on OPENING, not on the
   * identity of the getter. */
  const targetRef = useLatest(target)

  useEffect(() => {
    if (!open || !ready) return
    /* Remembered before focus moves, and only once per opening: re-reading it
     * on a later render would remember something inside the layer itself. */
    returnTo.current ??= document.activeElement instanceof HTMLElement ? document.activeElement : null
    /* NOW IF IT IS THERE, NEXT FRAME IF IT IS NOT. A field inside a layer that
     * renders with `open` exists already, and waiting a frame for it would move
     * focus after the reader has started typing; a menu item inside a portal
     * that mounts a tick later does not exist yet, and focusing now would land
     * on nothing. Both are real callers, so both are answered. */
    const el = targetRef.current()
    if (el) { el.focus(); return }
    const raf = requestAnimationFrame(() => { targetRef.current()?.focus() })
    return () => cancelAnimationFrame(raf)
  }, [open, ready, targetRef])

  useEffect(() => {
    if (open) return
    const back = returnTo.current
    returnTo.current = null
    /* Only if it is still there: a menu item that opened a dialog and then
     * unmounted cannot take focus back, and asking it to would move focus to
     * the body — the thing this hook exists to prevent. */
    if (back?.isConnected) back.focus()
  }, [open])
}
