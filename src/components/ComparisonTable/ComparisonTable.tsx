import './ComparisonTable.css'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { Icon } from '../Icon'
import { Table, TableScroll, THead, TBody, Tr, Th, Td } from '../Table'

export type ComparisonSubject = {
  key: string
  name: ReactNode
  /** The line under the name: a price, a term, a one-line summary. */
  note?: ReactNode
  /** The column the reader is being pointed at. One, or none. */
  recommended?: boolean
  /** What choosing this one does. Rendered under the column. */
  action?: ReactNode
}

export type ComparisonRow = {
  label: ReactNode
  /** One entry per subject key. `true` and `false` are rendered as a tick and
   *  a blank with the words behind them, so the column is not read by colour
   *  or by shape alone. */
  values: Record<string, ReactNode | boolean>
}

type Props = {
  label: string
  /** Hides the caption visually and KEEPS it for a screen reader. The caption is how a table
   *  announces what it is, so this hides it; it never removes it.
   */
  captionHidden?: boolean
  subjects: readonly ComparisonSubject[]
  rows: readonly ComparisonRow[]
  /** The header over the attribute column. */
  rowHeader?: ReactNode
  className?: string
}

/**
 * A few subjects as COLUMNS and their attributes as rows: plans, vendors,
 * candidates, options. The one table that transposes on purpose, because the
 * reader is comparing three things across twenty attributes rather than twenty
 * records across three fields.
 *
 * Many subjects turn the columns into a scroll nobody can hold in their head:
 * past about five, the subjects are records and belong in rows.
 *
 * Copy: row labels are the question each row answers, identical across subjects.
 * A row that changes its wording per column is not comparable.
 */
export function ComparisonTable({ label, captionHidden, subjects, rows, rowHeader, className }: Props) {
  const mark = (value: ReactNode | boolean) => {
    if (value === true) {
      return (
        <span className="comparison-mark" data-included="true">
          <Icon name="check" />
          <span className="sr-only">Included</span>
        </span>
      )
    }
    if (value === false) {
      /* Not a dash: a blank cell with the word behind it. A dash is read as a
       * value by a screen reader and as "unknown" by half of everyone else. */
      return <span className="comparison-mark"><span className="sr-only">Not included</span></span>
    }
    return value
  }

  return (
    <TableScroll label={label}>
      <Table caption={label} captionHidden={captionHidden} stickyHeader stickyColumn className={cn('comparison-table', className)}>
        <THead>
          <Tr>
            <Th scope="col">{rowHeader}</Th>
            {subjects.map((s) => (
              <Th key={s.key} scope="col" align="center" data-recommended={s.recommended || undefined}>
                <span className="comparison-subject">
                  <span className="comparison-name">{s.name}</span>
                  {s.note ? <span className="comparison-note">{s.note}</span> : null}
                  {s.action ? <span className="comparison-action">{s.action}</span> : null}
                </span>
              </Th>
            ))}
          </Tr>
        </THead>
        <TBody>
          {rows.map((row, i) => (
            <Tr key={i}>
              <Th scope="row">{row.label}</Th>
              {subjects.map((s) => (
                <Td key={s.key} align="center" data-recommended={s.recommended || undefined}>
                  {mark(row.values[s.key])}
                </Td>
              ))}
            </Tr>
          ))}
        </TBody>
      </Table>
    </TableScroll>
  )
}
