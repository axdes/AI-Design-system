/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { DataGrid } from './DataGrid'

type Row = { id: string; name: string; email: string; amount: number }

/* 5,000 rows, only the visible window in the DOM. For a short static table use
 * <Table>; reach for DataGrid when the row count is large. */
const ROWS: Row[] = Array.from({ length: 5000 }, (_, i) => ({
  id: String(i),
  name: `Customer ${i + 1}`,
  email: `customer${i + 1}@example.com`,
  amount: (i * 37) % 9000,
}))

export function Example() {
  return (
    <DataGrid<Row>
      label="Customers"
      rows={ROWS}
      rowKey={(r) => r.id}
      height={320}
      columns={[
        { key: 'name', header: 'Name', cell: (r) => r.name, width: '1.5fr' },
        { key: 'email', header: 'Email', cell: (r) => r.email, width: '2fr' },
        { key: 'amount', header: 'Amount', align: 'end', cell: (r) => `SAR ${r.amount.toLocaleString()}` },
      ]}
    />
  )
}
