import { useMemo, type ReactNode } from 'react'
import { Table, TableScroll, THead, TBody, TFoot, Tr, Th, Td } from '../Table'

export type PivotAxis = { key: string; label: ReactNode }

type Props = {
  /** The name of the table. Say what is crossed with what: "Hours by team and
   *  month" tells the reader which axis is which before they read a cell. */
  label: string
  /** Also rendered as the table's caption unless `captionHidden`. */
  captionHidden?: boolean
  /** The vertical axis: one row per entry, each a row header. */
  rows: readonly PivotAxis[]
  /** The horizontal axis: one column per entry, each a column header. */
  columns: readonly PivotAxis[]
  /** The measure at a crossing. Undefined means no observation, which is not
   *  the same fact as zero and is not printed as one. */
  value: (rowKey: string, columnKey: string) => number | undefined
  /** How a number is written. Defaults to the local integer format. */
  format?: (value: number) => string
  /** Row totals in a last column and column totals in the footer. A matrix is
   *  usually read for the margins as much as for the cells. */
  totals?: boolean
  /** Paints every cell on the heatmap ramp, scaled to the largest value. For
   *  the matrix read as a pattern rather than as numbers. */
  heat?: boolean
  /** The header of the corner cell: what the ROWS are. */
  /* REQUIRED. The corner cell names what the ROWS are, and a pivot whose
   * corner is empty fails axe's empty-table-header — the header row then has a
   * cell that announces nothing, and a screen reader reads the first data
   * column with no idea what it is a column OF. It was optional and the
   * omission was silent until a specimen left it out (2026-08-26). */
  rowHeader: ReactNode
  className?: string
}

const HEAT_STEPS = 4

/**
 * Two categorical axes and one measure in the cell: teams by month, region by
 * product, skill by level. A crosstab, in other words, and the one table shape
 * where a cell is identified by both of its headers rather than by its row.
 *
 * Not for one axis (that is a `<Table>` with a sortable column), and not for a
 * value the reader has to read exactly while it is painted (`heat` off).
 *
 * Copy: row and column headers are the dimensions' own names; the measure is
 * named once, with its unit, rather than repeated in every cell.
 */
export function PivotTable({
  label, captionHidden, rows, columns, value, format, totals, heat, rowHeader, className,
}: Props) {
  const write = useMemo(() => format ?? ((n: number) => n.toLocaleString()), [format])

  const max = useMemo(() => {
    if (!heat) return 0
    let top = 0
    for (const r of rows) for (const c of columns) top = Math.max(top, value(r.key, c.key) ?? 0)
    return top
  }, [heat, rows, columns, value])

  /* The ramp is discrete and scaled to the largest observation: a cell says
   * "high for this table", which is the only claim a colour can honestly make
   * without a legend of its own. */
  const step = (n: number | undefined) => {
    if (!heat || n === undefined || max <= 0) return undefined
    const s = Math.ceil((n / max) * HEAT_STEPS)
    return Math.min(HEAT_STEPS, Math.max(0, s)) as 0 | 1 | 2 | 3 | 4
  }

  const columnTotal = (columnKey: string) => rows.reduce((sum, r) => sum + (value(r.key, columnKey) ?? 0), 0)
  const rowTotal = (rowKey: string) => columns.reduce((sum, c) => sum + (value(rowKey, c.key) ?? 0), 0)
  const grandTotal = rows.reduce((sum, r) => sum + rowTotal(r.key), 0)

  return (
    <TableScroll label={label}>
      <Table caption={label} captionHidden={captionHidden} nowrap className={className}>
        <THead>
          <Tr>
            {/* The corner cell heads the row headers, so it is a header too. */}
            <Th scope="col">{rowHeader}</Th>
            {columns.map((c) => <Th key={c.key} align="end">{c.label}</Th>)}
            {totals ? <Th align="end">Total</Th> : null}
          </Tr>
        </THead>
        <TBody>
          {rows.map((r) => (
            <Tr key={r.key}>
              <Th scope="row" emphasis>{r.label}</Th>
              {columns.map((c) => {
                const n = value(r.key, c.key)
                return (
                  <Td key={c.key} align="end" heat={step(n)}>
                    {/* No observation is not zero, and printing it as zero is
                        the most common lie a matrix tells. */}
                    {n === undefined ? 'None' : write(n)}
                  </Td>
                )
              })}
              {totals ? <Td align="end" emphasis>{write(rowTotal(r.key))}</Td> : null}
            </Tr>
          ))}
        </TBody>
        {totals
          ? (
            <TFoot>
              <Tr>
                <Th scope="row">Total</Th>
                {columns.map((c) => <Td key={c.key} align="end">{write(columnTotal(c.key))}</Td>)}
                <Td align="end">{write(grandTotal)}</Td>
              </Tr>
            </TFoot>
          )
          : null}
      </Table>
    </TableScroll>
  )
}
