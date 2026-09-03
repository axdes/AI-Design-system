import { useCallback, useState, type KeyboardEvent } from 'react'
import { useListKeys } from './useListKeys'

/**
 * AN ACTIVE ROW IN A LIST, MOVED BY THE KEYBOARD — the second mechanism this
 * system had written more than once.
 *
 * Three components carried their own copy (<Combobox>, <CommandPalette>,
 * <ContextMenu>), each a chain of `if (e.key === 'ArrowDown')` with the same
 * `Math.min` / `Math.max` clamp, and all three drifted the same way: none of
 * them answered Home or End, which the ARIA listbox and menu patterns both ask
 * for and which <Dropdown> has always had. Measured 2026-08-31. One hook, and
 * all three gain the two keys they were missing.
 *
 * NOT for <Dropdown>. Its items are real buttons and it moves real DOM focus
 * between them, which is the menu pattern; this is the `aria-activedescendant`
 * pattern, where focus stays in the input and an index says which row is
 * current. Two genuinely different models, and folding them together would make
 * one of them wrong — the same reason `useDismiss` is separate from
 * `useAnchoredLayer`.
 *
 * `handleKey` returns whether it took the event, so the caller keeps its own
 * keys: Backspace removes a token in a Combobox, Space selects in a menu, and
 * Escape means something different in each.
 */
export function useListNavigation({ count, onEnter }: {
  /** How many rows there are RIGHT NOW. The list shrinks as a query narrows it,
   *  so the index is clamped on every move rather than trusted. */
  count: number
  /** Enter on the active row. Left out where the caller commits some other way. */
  onEnter?: (index: number) => void
}) {
  const [active, setActive] = useState(0)

  /* The four keys that walk a bounded list are not this pattern's own: they are
     the same in a menu, a tree and a listbox, and useListKeys owns them for all
     three (2026-09-02). What stays here is what makes this the activedescendant
     pattern — the index is state, and Enter commits it. */
  const listKeys = useListKeys({ count, index: active, move: setActive })

  const handleKey = useCallback((e: KeyboardEvent): boolean => {
    const last = Math.max(0, count - 1)
    if (listKeys(e)) return true
    /* One key left after the four went into the shared mechanism, and it is the
     * one that commits: Enter reads the active row and hands it over. */
    if (e.key !== 'Enter' || !onEnter || count === 0) return false
    e.preventDefault()
    setActive((i) => { onEnter(Math.min(i, last)); return i })
    return true
  }, [count, onEnter, listKeys])

  return { active, setActive, handleKey }
}
