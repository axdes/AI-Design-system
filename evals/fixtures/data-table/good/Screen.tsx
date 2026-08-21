/* Reference solution — what "used the design system" looks like for this task.
 * Doubles as a regression fixture: the scorers must give it a perfect score. */
import { useMemo, useState } from 'react'
import { Badge } from '@/components/Badge'
import { Breadcrumb } from '@/components/Breadcrumb'
import { Card } from '@/components/Card'
import { Pagination } from '@/components/Pagination'
import { Stack } from '@/components/Layout'
import { Table, TBody, Td, Th, THead, Tr } from '@/components/Table'

type Status = 'paid' | 'due' | 'overdue'
type Invoice = { id: string; client: string; amount: number; status: Status }

const TONE: Record<Status, 'success' | 'warning' | 'danger'> = {
  paid: 'success',
  due: 'warning',
  overdue: 'danger',
}

const INVOICES: Invoice[] = [
  { id: 'INV-1041', client: 'Northwind', amount: 12400, status: 'paid' },
  { id: 'INV-1042', client: 'Sabic', amount: 8600, status: 'due' },
  { id: 'INV-1043', client: 'Maaden', amount: 21500, status: 'overdue' },
  { id: 'INV-1044', client: 'STC', amount: 4300, status: 'paid' },
  { id: 'INV-1045', client: 'Almarai', amount: 15900, status: 'due' },
]

const PER_PAGE = 3

export function Screen() {
  const [dir, setDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)

  const sorted = useMemo(
    () => [...INVOICES].sort((a, b) => (dir === 'asc' ? a.amount - b.amount : b.amount - a.amount)),
    [dir],
  )
  const pageCount = Math.ceil(sorted.length / PER_PAGE)
  const rows = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <Stack gap={4}>
      <Breadcrumb items={[{ label: 'Billing', onSelect: () => undefined }, { label: 'Invoices' }]} />

      <Card flush>
        <Table>
          <THead>
            <Tr>
              <Th>Invoice</Th>
              <Th>Client</Th>
              <Th
                align="end"
                sortable
                sortDirection={dir}
                onSort={() => setDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
              >
                Amount
              </Th>
              <Th>Status</Th>
            </Tr>
          </THead>
          <TBody>
            {rows.map((inv) => (
              <Tr key={inv.id}>
                <Td emphasis>{inv.id}</Td>
                <Td>{inv.client}</Td>
                <Td align="end">{`SAR ${inv.amount.toLocaleString()}`}</Td>
                <Td>
                  <Badge tone={TONE[inv.status]} fill="soft">{inv.status}</Badge>
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </Card>

      <Pagination page={page} pageCount={pageCount} onChange={setPage} />
    </Stack>
  )
}
