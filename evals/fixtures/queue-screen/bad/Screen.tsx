/* The plausible wrong answer: every component real, every prop legal, and the
 * representation wrong — a tile per record where the reviewer's job is to
 * compare amounts and dates across the queue. Conformance scoring alone gives
 * this 100%; it exists to prove the appropriateness dimensions bite. */
import { useState } from 'react'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { Card, CardHeader, CardTitle } from '@/components/Card'
import { MetaItem } from '@/components/MetaItem'
import { Grid, Row } from '@/components/Layout'

type Status = 'pending' | 'approved' | 'returned'
type Report = { id: string; submitter: string; team: string; amount: number; submitted: string; status: Status }

const QUEUE: Report[] = [
  { id: 'EXP-2201', submitter: 'Lina Haddad', team: 'Field Ops', amount: 1840, submitted: '2026-08-14', status: 'pending' },
  { id: 'EXP-2202', submitter: 'Omar Farsi', team: 'Logistics', amount: 460, submitted: '2026-08-15', status: 'pending' },
  { id: 'EXP-2204', submitter: 'Yousef Anzi', team: 'Facilities', amount: 320, submitted: '2026-08-17', status: 'pending' },
]

export function Screen() {
  const [approved, setApproved] = useState<string[]>([])
  return (
    <Grid gap={4}>
      {QUEUE.map((r) => (
        <Card key={r.id} stretch>
          <CardHeader>
            <CardTitle>{r.id}</CardTitle>
            <Badge tone={approved.includes(r.id) ? 'success' : 'warning'} fill="soft">
              {approved.includes(r.id) ? 'approved' : r.status}
            </Badge>
          </CardHeader>
          <Row gap={3}>
            <MetaItem icon="person">{r.submitter}</MetaItem>
            <MetaItem icon="group">{r.team}</MetaItem>
            <MetaItem icon="schedule">{r.submitted}</MetaItem>
          </Row>
          <Row gap={3}>
            <MetaItem icon="payments">{`SAR ${r.amount.toLocaleString()}`}</MetaItem>
          </Row>
          <Button variant="primary" size="sm" onClick={() => setApproved((a) => [...a, r.id])}>
            Approve
          </Button>
        </Card>
      ))}
    </Grid>
  )
}
