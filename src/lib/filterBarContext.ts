import { createContext, use } from 'react'

/* Shared between FilterBar (organism) and FilterDropdown (molecule) without
 * an upward atomic import — both depend on this neutral lib module instead.
 * `inSheet` lets FilterDropdown render select-style + full-width menu inside
 * the mobile FilterBar modal.
 *
 * @internal Plumbing rather than a choice: the two parts that share it reach for
 * each other, not for this, so it stays out of the index an agent reads on every
 * task. (2026-09-03)
 */
export const FilterBarContext = createContext<{ inSheet: boolean }>({ inSheet: false })

export function useFilterBar() {
  return use(FilterBarContext)
}
