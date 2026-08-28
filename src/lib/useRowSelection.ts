import { useCallback, useMemo, useState } from 'react'

/**
 * The selection model a selectable table needs, in one place: which rows are
 * picked, the tri-state of the header checkbox, and what "select all" means.
 *
 * Why a hook and not a prop on the table: selection is read by three things at
 * once (the row, the header checkbox and the batch bar), and every product that
 * hand-rolls it gets the same two things wrong. The header checkbox is
 * indeterminate rather than "some", and the count is a number the bar can say
 * out loud.
 *
 * Selecting all selects the rows THIS PAGE has. A set that reaches past the
 * page is a second, explicit choice the screen has to offer in words, because
 * a checkbox cannot say whether it means forty rows or twelve hundred.
 */
export function useRowSelection<Id extends string | number>(ids: readonly Id[]) {
  const [selected, setSelected] = useState<ReadonlySet<Id>>(() => new Set<Id>())

  const toggle = useCallback((id: Id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const clear = useCallback(() => setSelected(new Set()), [])

  /* The rows that are BOTH selected and still present: a filter that removes a
   * selected row must not leave it in the count, or the bar acts on what the
   * user can no longer see. */
  const present = useMemo(() => ids.filter((id) => selected.has(id)), [ids, selected])

  const toggleAll = useCallback(() => {
    setSelected((prev) => (ids.every((id) => prev.has(id)) ? new Set<Id>() : new Set(ids)))
  }, [ids])

  const all = ids.length > 0 && present.length === ids.length
  return {
    /** The selected ids that are on screen, in the order the rows are in. */
    selected: present,
    count: present.length,
    isSelected: (id: Id) => selected.has(id),
    toggle,
    toggleAll,
    clear,
    /** Every visible row is picked: the header checkbox is checked. */
    all,
    /** Some but not all: the header checkbox is indeterminate, never "off". */
    some: present.length > 0 && !all,
  }
}
