import './BatchActions.css'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../Button'
import { cn } from '../../lib/cn'

type Props = {
  /** How many rows are picked. Said in words, because a bar that acts on a
   *  selection has to name the size of it. */
  count: number
  /** Drops the selection. The way out that is not unticking twelve boxes. */
  onClear: () => void
  /** What can be done to the selection. Every action here acts on all of it. */
  children: ReactNode
  /** The sentence that offers the rest of the set ("Select all 1,284"), for a
   *  selection that can reach past the page. A checkbox cannot say whether it
   *  means this page or the query, so this says it in words. */
  selectAll?: ReactNode
  className?: string
}

/**
 * The bar that appears once rows are selected: the count, what can be done to
 * them, and the way out. It replaces the table's toolbar rather than sitting
 * beside it, so an action can never be ambiguous about what it applies to.
 */
export function BatchActions({ count, onClear, children, selectAll, className }: Props) {
  const { t } = useTranslation()
  return (
    /* A toolbar of actions, named by its own count: a screen reader landing
     * here hears how many rows it is about to act on. */
    <div className={cn('batch-actions', className)} role="toolbar" aria-label={t('table.selected', { count })}>
      <span className="batch-actions-count" aria-live="polite">{t('table.selected', { count })}</span>
      {selectAll ? <span className="batch-actions-all">{selectAll}</span> : null}
      <div className="batch-actions-list">{children}</div>
      <Button variant="ghost" size="sm" onClick={onClear}>{t('table.clearSelection')}</Button>
    </div>
  )
}
