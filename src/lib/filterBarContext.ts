import { createContext, use } from 'react'

/* Shared between FilterBar (organism) and FilterDropdown (molecule) without
 * an upward atomic import — both depend on this neutral lib module instead.
 * `inSheet` lets FilterDropdown render select-style + full-width menu inside
 * the mobile FilterBar modal. */
export const FilterBarContext = createContext<{ inSheet: boolean }>({ inSheet: false })

export function useFilterBar() {
  return use(FilterBarContext)
}
