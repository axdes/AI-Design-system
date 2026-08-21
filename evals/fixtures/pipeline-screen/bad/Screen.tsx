/* The tempting wrong answer: a tile per contract and a search box. Every
 * component and prop here is real — only the decisions are wrong. */
import { useState } from 'react'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { Card, CardTitle } from '@/components/Card'
import { SearchInput } from '@/components/SearchInput'
import { Stack, Row } from '@/components/Layout'

const CONTRACTS = [
  { id: 'CT-2403', counterparty: 'Northwind Logistics BV', endDate: '2026-09-04', status: 'awaiting review' },
  { id: 'CT-2391', counterparty: 'Helios Energy Trading GmbH', endDate: '2026-08-29', status: 'renewal sent' },
  { id: 'CT-2418', counterparty: 'Bluecrest Data Services Ltd', endDate: '2026-09-11', status: 'awaiting review' },
]

export function Screen() {
  const [query, setQuery] = useState('')
  const shown = CONTRACTS.filter((c) => c.counterparty.toLowerCase().includes(query.toLowerCase()))
  return (
    <Stack gap={4}>
      <SearchInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a contract" />
      <Row gap={4}>
        {shown.map((c) => (
          <Card key={c.id} interactive>
            <CardTitle>{c.counterparty}</CardTitle>
            <p>{c.id} — ends {c.endDate}</p>
            <Badge tone="warning">{c.status}</Badge>
            <Button variant="secondary">Send for renewal</Button>
          </Card>
        ))}
      </Row>
    </Stack>
  )
}
