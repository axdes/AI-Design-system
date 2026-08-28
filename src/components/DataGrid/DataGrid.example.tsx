/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { DataGrid, type DataGridSort } from './DataGrid'
import { EmptyState } from '../EmptyState'

type Row = { id: string; name: string; email: string; amount: number; status: string; note: string }

/* A closed list: the column is a select in every row, so one click opens it. */
const STATUS = ['', 'active', 'on hold', 'closed'] as const

/* 5,000 rows, only the visible window in the DOM. For a short static table use
 * <Table>; reach for DataGrid when the row count is large. */
const ROWS: Row[] = Array.from({ length: 5000 }, (_, i) => ({
  id: String(i),
  name: `Customer ${i + 1}`,
  email: `customer${i + 1}@example.com`,
  amount: (i * 37) % 9000,
  status: STATUS[(i % 3) + 1]!,
  note: `Renewal ${i + 1}: they asked for the annual plan and a second seat, and want the invoice split by department.`,
}))

export function Example() {
  const [rows, setRows] = useState(ROWS)
  const [sort, setSort] = useState<DataGridSort>({ key: 'name', sortDirection: 'asc' })

  /* The grid reports the sort; the caller owns the order. It has to: the rows
     may come from a server that sorts them, and a grid that sorted its own
     window would only sort the part that happens to be in the DOM. */
  const sorted = [...rows].sort((a, b) => {
    const dir = sort.sortDirection === 'asc' ? 1 : -1
    return sort.key === 'amount' ? (a.amount - b.amount) * dir : a.name.localeCompare(b.name) * dir
  })

  return (
    <DataGrid<Row>
      label="Customers"
      rows={sorted}
      rowKey={(r) => r.id}
      height={320}
      rowHeight={56}
      sort={sort}
      onSortChange={setSort}
      /* A TEXT cell is entered deliberately: Enter or F2 on the focused cell, or
         a single click. A cell with `options` has no editor to enter — it is the
         select. `value` is what the control shows, since the cell itself may be
         formatted. */
      onCellChange={(row, key, value) => {
        if (key !== 'name' && key !== 'status') return
        setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, [key]: value } : r)))
      }}
      empty={<EmptyState icon="search" title="No customers" description="Nothing matches this filter yet." />}
      columns={[
        { key: 'name', header: 'Name', cell: (r) => r.name, value: (r) => r.name, width: '1.5fr', sortable: true, editable: true },
        { key: 'email', header: 'Email', cell: (r) => r.email, width: '1.5fr' },
        /* `wrap` gives a column of SENTENCES a second line instead of an ellipsis a third of the
           way through the first word that matters; the row is 56px here to leave room for it. */
        { key: 'note', header: 'Note', cell: (r) => <span title={r.note}>{r.note}</span>, width: '2fr', wrap: true },
        /* `options` makes the cell a select rather than a value that turns into
           one: a closed list is chosen in a single click, and nothing downstream
           has to count a spelling somebody invented. */
        { key: 'status', header: 'Status', cell: (r) => r.status, value: (r) => r.status, width: '9rem', editable: true, options: STATUS },
        { key: 'amount', header: 'Amount', align: 'end', sortable: true, cell: (r) => `SAR ${r.amount.toLocaleString()}` },
      ]}
    />
  )
}
