import './TableToolbar.css'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { SegmentedControl } from '../SegmentedControl'
import { cn } from '../../lib/cn'

/** The two row densities `<Table>` has, in the system's own words: comfortable
 *  is a table read and acted on, compact is a reference table or a log, where
 *  more rows on screen is worth the smaller type. (`<ContentCard layout="row">` uses the same
 *  words for the same question, and adds `dense`.) */
type Density = 'comfortable' | 'compact'

/* Monolithic because the toolbar is the row above a table that reports its
 * state: the count, the density it can change, and the batch bar that
 * replaces it when rows are selected. A compound would be a row of parts
 * that have to agree about the same table. */
type Props = {
  /** What this table is called. Leave it out when the page heading above the
   *  table already says the same words. */
  title?: ReactNode
  /** Which heading level the title is. A level is a property of the DOCUMENT,
   *  not of the toolbar: under a section heading it is h3, directly under the
   *  page title it is h2. Default h3. */
  as?: 'h2' | 'h3' | 'h4'
  /** How many rows the table holds AFTER filtering. A count is orientation:
   *  without it a filtered table and a small table look identical. */
  count?: number
  /** The narrowing controls: a SearchInput, a FilterBar, a ColumnPicker. */
  children?: ReactNode
  /** The table's own actions (create, export, import), at the trailing edge. */
  actions?: ReactNode
  /** The row density this table is read at. Given with `onDensityChange`, the
   *  toolbar renders the switch. Density is a decision of the screen and of the
   *  reader, so remember the choice per collection rather than resetting it. */
  density?: Density
  onDensityChange?: (density: Density) => void
  /** Replaces the whole toolbar while rows are selected: pass
   *  `<BatchActions>`. One bar, two states, so the actions that apply to a
   *  selection never sit beside the ones that do not. */
  batch?: ReactNode
  className?: string
}

/**
 * The row above a table: what it is called, how many rows it has, what narrows
 * it, and what acts on it. Distinct from `<FilterBar>`, which is one of the
 * things that goes inside it, and from `<PageHeader>`, which belongs to the
 * screen rather than to this table.
 *
 * While a selection exists the toolbar is replaced by `batch`, which is the
 * one arrangement that cannot mislead: an Export next to a "3 selected" bar
 * has to say which three it means (Carbon batch action bar).
 *
 * Copy: the title names the collection and the count says how many are in it
 * after filtering, not before.
 */
export function TableToolbar({ title, as: Title = 'h3', count, children, actions, batch, density, onDensityChange, className }: Props) {
  const { t } = useTranslation()
  if (batch) return <div className={cn('table-toolbar', 'table-toolbar-batch', className)}>{batch}</div>

  return (
    <div className={cn('table-toolbar', className)}>
      {title ? <Title className="table-toolbar-title">{title}</Title> : null}
      {count === undefined ? null : (
        /* Polite, because the count changes when a filter is applied and the
         * user who cannot see the rows shorten has no other way to know. */
        <span className="table-toolbar-count" aria-live="polite">
          {t('table.rows', { count })}
        </span>
      )}
      {children ? <div className="table-toolbar-filters">{children}</div> : null}
      {density && onDensityChange
        ? (
          <SegmentedControl<Density>
            size="sm"
            label={t('table.density')}
            value={density}
            onChange={onDensityChange}
            options={[
              { value: 'comfortable', label: t('table.densityDefault') },
              { value: 'compact', label: t('table.densityCompact') },
            ]}
            className="table-toolbar-density"
          />
        )
        : null}
      {actions ? <div className="table-toolbar-actions">{actions}</div> : null}
    </div>
  )
}
