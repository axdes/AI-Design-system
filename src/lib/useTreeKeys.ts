import { useCallback, type KeyboardEvent } from 'react'
import { useListKeys } from './useListKeys'

/**
 * THE KEYBOARD OF A TREE — the third mechanism this system had written twice.
 *
 * <Tree> and <TreeTable> both answer the ARIA tree pattern, and both wrote it
 * out by hand: Down and Up move one row, Right opens a closed branch or steps
 * into an open one, Left closes an open branch or climbs to its parent. Same six
 * decisions, two files, and they had already drifted the way copies do —
 * <Tree> answered neither Home nor End, which the pattern names and <TreeTable>
 * had (measured 2026-09-02, the day lint:mechanism started reporting the pair).
 * Written once, <Tree> gains the two keys by arriving.
 *
 * EVERYTHING IS AN INDEX INTO THE VISIBLE ROWS, which is what makes one hook
 * cover both. <Tree> thinks in node ids and <TreeTable> in row numbers, but both
 * flatten to the list a reader actually walks, and in that list "the first child
 * of an open branch" is simply the next row. The caller keeps ownership of what
 * a row IS: this hook never touches the DOM, it says which index should have
 * focus and the caller moves it.
 *
 * FOCUS MOVES SYNCHRONOUSLY, in the caller's `move`, not in an effect — a single
 * "ArrowDown then Enter" has to land the Enter on the row that just arrived.
 * Both components had already learned that separately; the comment survives here
 * so the next caller does not learn it a third time.
 *
 * Enter and Space are deliberately NOT here. <Tree> selects on them, <TreeTable>
 * toggles, and folding two commit semantics into one would make one of them
 * wrong — the same reason useListNavigation stays out of <Dropdown> and
 * useDismiss stays out of useAnchoredLayer. `handleKey` returns whether it took
 * the event, so a caller keeps every key this hook did not answer.
 */
export function useTreeKeys({ count, index, isBranch, isOpen, parentIndex, move, toggle }: {
  /** How many rows are VISIBLE right now — a closed branch hides its children,
   *  so this changes as the reader opens and closes things. */
  count: number
  /** The row that currently has focus, as an index into those visible rows. */
  index: number
  isBranch: (index: number) => boolean
  isOpen: (index: number) => boolean
  /** The row that contains this one, or -1 at the top level. */
  parentIndex: (index: number) => number
  /** Put focus on this row. The caller clamps nothing; this hook does. */
  move: (index: number) => void
  toggle: (index: number) => void
}) {
  const listKeys = useListKeys({ count, index, move })

  return useCallback((e: KeyboardEvent): boolean => {
    if (count === 0 || index < 0) return false
    const last = Math.max(0, count - 1)
    const at = (i: number) => move(Math.max(0, Math.min(last, i)))
    const branch = isBranch(index)

    /* Down, Up, Home and End are not a tree's own idea: they walk any bounded
       list, and useListKeys owns them for all three callers. What is left here
       is what makes a tree a tree. */
    if (listKeys(e)) return true

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault()
        if (branch && !isOpen(index)) toggle(index)
        else if (branch) at(index + 1)
        return true
      case 'ArrowLeft': {
        e.preventDefault()
        if (branch && isOpen(index)) { toggle(index); return true }
        const parent = parentIndex(index)
        if (parent >= 0) at(parent)
        return true
      }
      default:
        return false
    }
  }, [count, index, isBranch, isOpen, parentIndex, move, toggle, listKeys])
}
