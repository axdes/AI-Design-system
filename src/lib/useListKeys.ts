import { useCallback, type KeyboardEvent } from 'react'

/**
 * DOWN, UP, HOME, END OVER A BOUNDED LIST — the smallest mechanism here, and
 * the one three others were each rebuilding.
 *
 * The four keys and the clamp are the same wherever a list is walked; what
 * differs is only what "the current row" MEANS. <Dropdown> moves real DOM focus
 * between real buttons (the menu pattern), useListNavigation keeps focus in an
 * input and moves an index (the activedescendant pattern), useTreeKeys moves
 * focus and then adds the two branch keys. Three models, one keyboard, and all
 * three had written out `Math.min(i + 1, last)` for themselves.
 *
 * So the difference lives in `move` and nothing else: this hook decides WHICH
 * index should be current and hands it over. It never touches the DOM and never
 * holds state, which is what lets the three keep the models that make them
 * different — the mistake would have been one hook with a `mode` flag.
 *
 * Enter, Space and Escape are deliberately absent: they commit, and every caller
 * commits differently. `handleKey` returns whether it took the event.
 *
 * `count` and `index` may be FUNCTIONS, and that is not a convenience. A caller
 * that keeps the current row in React state knows both while it renders; one
 * that moves real DOM focus, like <Dropdown>, only knows them when the key
 * arrives — its list is whatever is in the menu at that moment and its index is
 * `document.activeElement`. Taking numbers only would have forced that caller
 * to mirror the DOM into state, which is the bug the menu pattern exists to
 * avoid. (2026-09-02)
 */
export function useListKeys({ count, index, move }: {
  /** How many rows there are RIGHT NOW — a filtered list shrinks under the
   *  reader, so the clamp is applied per keystroke rather than trusted. */
  count: number | (() => number)
  /** Which row is current. -1 while nothing is. */
  index: number | (() => number)
  move: (index: number) => void
}) {
  return useCallback((e: KeyboardEvent): boolean => {
    const n = typeof count === 'function' ? count() : count
    const at0 = typeof index === 'function' ? index() : index
    if (n <= 0) return false
    const last = n - 1
    const at = (i: number) => move(Math.max(0, Math.min(last, i)))
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); at(at0 + 1); return true
      case 'ArrowUp': e.preventDefault(); at(at0 - 1); return true
      /* Both patterns name Home and End, and every copy of this that was written
         by hand had lost at least one of them. */
      case 'Home': e.preventDefault(); at(0); return true
      case 'End': e.preventDefault(); at(last); return true
      default: return false
    }
  }, [count, index, move])
}
