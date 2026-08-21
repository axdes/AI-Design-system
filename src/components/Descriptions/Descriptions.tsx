import './Descriptions.css'
import { type ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type Description = {
  term: ReactNode
  value: ReactNode
}

type Props = {
  items: Description[]
  /** stacked (term above value, default) or inline (term beside value). */
  layout?: 'stacked' | 'inline'
  /** Columns on wide screens (stacked layout only). Default 1. */
  columns?: 1 | 2 | 3
  className?: string
}

/* A read-only list of field/value pairs — a record's metadata, a summary panel.
 * Real <dl>/<dt>/<dd> so it reads as a description list to a screen reader.
 * Distinct from a form (no inputs) and from a Table (no rows of records). */
export function Descriptions({ items, layout = 'stacked', columns = 1, className }: Props) {
  return (
    <dl className={cn('descriptions', className)} data-layout={layout} data-columns={columns}>
      {items.map((item, i) => (
        // eslint-disable-next-line @eslint-react/no-array-index-key -- term is a ReactNode, so it cannot be a key; the list is read-only and never reorders
        <div className="descriptions-row" key={i}>
          <dt className="descriptions-term">{item.term}</dt>
          <dd className="descriptions-value">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
