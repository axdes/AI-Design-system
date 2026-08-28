/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { Table, TableScroll, THead, TBody, TFoot, Tr, Th, Td } from './Table'
import { BatchActions } from '../BatchActions'
import { Button } from '../Button'
import { Checkbox } from '../Checkbox'
import { Icon } from '../Icon'
import { TableToolbar } from '../TableToolbar'
import { useRowSelection } from '../../lib/useRowSelection'

const ROWS = [
  { id: 'inv-1041', supplier: 'Northwind Paper', due: '12 Sep', amount: 4820 },
  { id: 'inv-1042', supplier: 'Bergen Logistics', due: '15 Sep', amount: 12140 },
  { id: 'inv-1043', supplier: 'Kestrel Studios', due: '19 Sep', amount: 990 },
]
const IDS = ROWS.map((r) => r.id)
/* The checkbox column is a cell too: the footer has to span every one of them
   or the total lines up under nothing. */
const COLUMNS = 5
const money = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

export function Example() {
  const selection = useRowSelection(IDS)
  const [sort, setSort] = useState<'asc' | 'desc'>('asc')

  const rows = [...ROWS].sort((a, b) => (sort === 'asc' ? a.amount - b.amount : b.amount - a.amount))
  const total = ROWS.reduce((sum, r) => sum + r.amount, 0)

  return (
    <div>
      {/* One bar, two states: while rows are picked the toolbar IS the batch
          bar, so no action can be ambiguous about what it applies to. */}
      <TableToolbar
        title="Invoices due"
        count={rows.length}
        actions={<Button size="sm">New invoice<Icon name="add" /></Button>}
        batch={selection.count > 0
          ? (
            <BatchActions count={selection.count} onClear={selection.clear}>
              <Button variant="secondary" size="sm">Approve</Button>
              <Button variant="secondary" size="sm">Export</Button>
            </BatchActions>
          )
          : undefined}
      />

      <TableScroll label="Invoices due">
        <Table caption="Invoices due this month" captionHidden>
          <THead>
            <Tr>
              <Th select>
                {/* Tri-state: some rows picked is indeterminate, never "off". */}
                <Checkbox
                  aria-label="Select all rows"
                  checked={selection.all}
                  indeterminate={selection.some}
                  onChange={selection.toggleAll}
                />
              </Th>
              <Th>Invoice</Th>
              <Th>Supplier</Th>
              <Th>Due</Th>
              {/* Money ends the row, on tabular figures, so the digits line up. */}
              <Th align="end" sortable sortDirection={sort} onSort={() => setSort(sort === 'asc' ? 'desc' : 'asc')}>Amount</Th>
            </Tr>
          </THead>
          <TBody>
            {rows.map((r) => (
              <Tr key={r.id} selected={selection.isSelected(r.id)}>
                <Td select>
                  <Checkbox
                    aria-label={`Select ${r.id}`}
                    checked={selection.isSelected(r.id)}
                    onChange={() => selection.toggle(r.id)}
                  />
                </Td>
                {/* The identifier is a row header: it is how a screen reader
                    says which record a value belongs to. */}
                <Th scope="row" emphasis>{r.id}</Th>
                <Td>{r.supplier}</Td>
                <Td>{r.due}</Td>
                <Td align="end">{money.format(r.amount)}</Td>
              </Tr>
            ))}
          </TBody>
          {/* A total is not one more record: it lives in <TFoot>. */}
          <TFoot>
            <Tr>
              <Td colSpan={COLUMNS - 1}>Total due</Td>
              <Td align="end">{money.format(total)}</Td>
            </Tr>
          </TFoot>
        </Table>
      </TableScroll>
    </div>
  )
}
