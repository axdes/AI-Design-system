import './DataGrid.css'
import { useRef, useState, type ReactNode, type UIEvent } from 'react'
import { cn } from '../../lib/cn'

export type DataGridColumn<Row> = {
  key: string
  header: ReactNode
  /** Cell renderer. */
  cell: (row: Row) => ReactNode
  /** Column width (any CSS length). Default 1fr. */
  width?: string
  align?: 'start' | 'end' | 'center'
}

type Props<Row> = {
  columns: readonly DataGridColumn<Row>[]
  rows: readonly Row[]
  rowKey: (row: Row) => string
  /** Fixed row height in px — required for windowing. Default 40. */
  rowHeight?: number
  /** Visible viewport height in px. Default 400. */
  height?: number
  /** Extra rows rendered above/below the viewport to smooth scrolling. Default 6. */
  overscan?: number
  /** Accessible name for the grid. */
  label: string
  className?: string
}

/* A virtualized table: only the rows in view (plus a small overscan) are in the
 * DOM, so tens of thousands of rows scroll smoothly. Rows are a fixed height (the
 * windowing needs it); a spacer sizes the scroll area to the full list. For a
 * short, static table use <Table>; reach for this when the row count is large. */
export function DataGrid<Row>({
  columns, rows, rowKey, rowHeight = 40, height = 400, overscan = 6, label, className,
}: Props<Row>) {
  const [scrollTop, setScrollTop] = useState(0)
  const bodyRef = useRef<HTMLDivElement>(null)

  const total = rows.length
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan)
  const visibleCount = Math.ceil(height / rowHeight) + overscan * 2
  const endIndex = Math.min(total, startIndex + visibleCount)
  const slice = rows.slice(startIndex, endIndex)

  const template = columns.map((c) => c.width ?? '1fr').join(' ')

  const onScroll = (e: UIEvent<HTMLDivElement>) => setScrollTop(e.currentTarget.scrollTop)

  return (
    <div className={cn('datagrid', className)} role="grid" aria-label={label} aria-rowcount={total}>
      <div className="datagrid-header" style={{ gridTemplateColumns: template }} role="row">
        {columns.map((c) => (
          <span key={c.key} className="datagrid-cell datagrid-th" data-align={c.align} role="columnheader">{c.header}</span>
        ))}
      </div>
      <div className="datagrid-body" ref={bodyRef} style={{ height }} onScroll={onScroll}>
        {/* Spacer sizes the scroll range to the full list; the window is offset into it. */}
        <div className="datagrid-spacer" style={{ height: total * rowHeight }}>
          <div className="datagrid-window" style={{ transform: `translateY(${startIndex * rowHeight}px)` }}>
            {slice.map((row, i) => (
              <div
                key={rowKey(row)}
                className="datagrid-row"
                role="row"
                aria-rowindex={startIndex + i + 1}
                style={{ gridTemplateColumns: template, height: rowHeight }}
              >
                {columns.map((c) => (
                  <span key={c.key} className="datagrid-cell" data-align={c.align} role="gridcell">{c.cell(row)}</span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
