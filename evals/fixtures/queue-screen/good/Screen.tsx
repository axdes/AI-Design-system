/* Reference solution — what "used the design system" looks like for this task.
 * The decision the task measures: a given queue of records with comparable
 * fields is a WORKLIST — rows in a table, status at a glance, one action in
 * place — never a tile per record (selection rules R1/R8). Doubles as a
 * regression fixture: the scorers must give it a perfect score. */
import { useMemo, useState } from 'react'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { EmptyState } from '@/components/EmptyState'
import { Stack } from '@/components/Layout'
import { Table, TBody, Td, Th, THead, Tr } from '@/components/Table'

type Status = 'pending' | 'approved' | 'returned'
type Report = { id: string; submitter: string; team: string; amount: number; submitted: string; status: Status }

const TONE: Record<Status, 'warning' | 'success' | 'danger'> = {
  pending: 'warning',
  approved: 'success',
  returned: 'danger',
}

const QUEUE: Report[] = [
  { id: 'EXP-2201', submitter: 'Lina Haddad', team: 'Field Ops', amount: 1840, submitted: '2026-08-14', status: 'pending' },
  { id: 'EXP-2202', submitter: 'Omar Farsi', team: 'Logistics', amount: 460, submitted: '2026-08-15', status: 'pending' },
  { id: 'EXP-2203', submitter: 'Sara Qadi', team: 'Field Ops', amount: 12750, submitted: '2026-08-15', status: 'approved' },
  { id: 'EXP-2204', submitter: 'Yousef Anzi', team: 'Facilities', amount: 320, submitted: '2026-08-17', status: 'pending' },
  { id: 'EXP-2205', submitter: 'Mona Otaibi', team: 'Logistics', amount: 5210, submitted: '2026-08-18', status: 'returned' },
]

export function Screen() {
  const [dir, setDir] = useState<'asc' | 'desc'>('desc')
  const [approved, setApproved] = useState<string[]>([])

  const rows = useMemo(
    () => [...QUEUE].sort((a, b) => (dir === 'asc' ? a.amount - b.amount : b.amount - a.amount)),
    [dir],
  )
  const statusOf = (r: Report): Status => (approved.includes(r.id) ? 'approved' : r.status)

  if (!rows.length) {
    return <EmptyState icon="check_circle" title="The queue is clear" description="Every submitted report has been handled." />
  }

  return (
    <Stack gap={4}>
      <Card flush>
        <Table>
          <THead>
            <Tr>
              <Th>Report</Th>
              <Th>Submitted by</Th>
              <Th>Team</Th>
              <Th
                align="end"
                sortable
                sortDirection={dir}
                onSort={() => setDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
              >
                Amount
              </Th>
              <Th>Submitted</Th>
              <Th>Status</Th>
              <Th align="end">Action</Th>
            </Tr>
          </THead>
          <TBody>
            {rows.map((r) => (
              <Tr key={r.id}>
                <Td emphasis>{r.id}</Td>
                <Td>{r.submitter}</Td>
                <Td>{r.team}</Td>
                <Td align="end">{`SAR ${r.amount.toLocaleString()}`}</Td>
                <Td>{r.submitted}</Td>
                <Td>
                  <Badge tone={TONE[statusOf(r)]} fill="soft">{statusOf(r)}</Badge>
                </Td>
                <Td align="end">
                  {statusOf(r) === 'pending' && (
                    <Button variant="secondary" size="sm" onClick={() => setApproved((a) => [...a, r.id])}>
                      Approve
                    </Button>
                  )}
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </Card>
    </Stack>
  )
}
