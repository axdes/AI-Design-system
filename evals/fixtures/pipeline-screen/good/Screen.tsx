/* Renewals window — the first screen of the contract renewals desk.
 * Spec: renewals-window (project renewals-desk).
 *
 * A worklist on ListPageTemplate: the window is given, nobody searches it, and
 * every contract gets one of the two decisions in place. No toolbar, no
 * FilterBar, no SearchInput — on purpose; see the spec's _why. */
import { useState } from 'react'
import { ListPageTemplate } from '@/blocks/ListPageTemplate'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { Row } from '@/components/Layout'
import { Table, TableScroll, THead, TBody, Tr, Th, Td } from '@/components/Table'

type Status = 'awaiting-review' | 'renewal-sent' | 'lapsing'

type Contract = {
  id: string
  counterparty: string
  accountManager: string
  annualValue: number
  /** ISO date; it drives the window order — soonest first. */
  endDate: string
  status: Status
}

/* Mock window: a realistic mid-week state, all three statuses present so every
 * row shape renders. Order does not matter here — the screen sorts by endDate. */
const CONTRACTS: Contract[] = [
  { id: 'CT-2403', counterparty: 'Northwind Logistics BV', accountManager: 'Dana Whitfield', annualValue: 184000, endDate: '2026-09-04', status: 'awaiting-review' },
  { id: 'CT-2391', counterparty: 'Helios Energy Trading GmbH', accountManager: 'Marcus Oyelaran', annualValue: 512000, endDate: '2026-08-29', status: 'renewal-sent' },
  { id: 'CT-2418', counterparty: 'Bluecrest Data Services Ltd', accountManager: 'Priya Raghunathan', annualValue: 96000, endDate: '2026-09-11', status: 'awaiting-review' },
  { id: 'CT-2377', counterparty: 'Arcadia Facilities Group', accountManager: 'Dana Whitfield', annualValue: 41000, endDate: '2026-08-27', status: 'lapsing' },
  { id: 'CT-2425', counterparty: 'Meridian Insurance Partners', accountManager: 'Tomas Lindqvist', annualValue: 268000, endDate: '2026-09-18', status: 'awaiting-review' },
  { id: 'CT-2409', counterparty: 'Osaka Precision Components KK', accountManager: 'Priya Raghunathan', annualValue: 730000, endDate: '2026-09-02', status: 'awaiting-review' },
  { id: 'CT-2431', counterparty: 'Ferrostar Freight SpA', accountManager: 'Marcus Oyelaran', annualValue: 155000, endDate: '2026-09-25', status: 'awaiting-review' },
  { id: 'CT-2388', counterparty: 'Quayside Catering Services', accountManager: 'Tomas Lindqvist', annualValue: 18500, endDate: '2026-08-31', status: 'renewal-sent' },
  { id: 'CT-2436', counterparty: 'Veldt Analytics Pty', accountManager: 'Dana Whitfield', annualValue: 224000, endDate: '2026-10-02', status: 'awaiting-review' },
]

const STATUS: Record<Status, { label: string; tone: 'warning' | 'success' | 'neutral' }> = {
  'awaiting-review': { label: 'Awaiting review', tone: 'warning' },
  'renewal-sent': { label: 'Renewal sent', tone: 'success' },
  lapsing: { label: 'Lapsing', tone: 'neutral' },
}

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const day = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

export function Screen() {
  const [contracts, setContracts] = useState(CONTRACTS)

  /* Both decisions land the same way: the row's status changes where it stands.
   * The contract stays in the window with its new status — the week's record
   * stays on screen (spec open question, decided for now). */
  const decide = (id: string, status: Status) =>
    setContracts((rows) => rows.map((r) => (r.id === id ? { ...r, status } : r)))

  /* Soonest end date first: reading order IS priority order, and nothing on the
   * screen can reorder it. */
  const inWindow = [...contracts].sort((a, b) => a.endDate.localeCompare(b.endDate))
  const awaiting = inWindow.filter((c) => c.status === 'awaiting-review').length

  return (
    <ListPageTemplate
      title={
        <>
          Renewals window
          {awaiting > 0 && <Badge tone="warning">{awaiting} awaiting review</Badge>}
        </>
      }
      panels
      isEmpty={inWindow.length === 0}
      empty={{
        icon: 'check_circle',
        title: 'The window is clear',
        description: 'Every contract this week has been decided. New contracts appear as their end dates approach.',
      }}
    >
      <Card flush>
        <TableScroll label="Contracts in the renewals window">
          <Table stickyHeader nowrap>
            <THead>
              <Tr>
                <Th>Contract</Th>
                <Th>Counterparty</Th>
                <Th>Account manager</Th>
                <Th align="end">Annual value</Th>
                <Th>End date</Th>
                <Th>Status</Th>
                <Th>Decision</Th>
              </Tr>
            </THead>
            <TBody>
              {inWindow.map((c) => (
                <Tr key={c.id}>
                  <Td emphasis>{c.id}</Td>
                  <Td>{c.counterparty}</Td>
                  <Td>{c.accountManager}</Td>
                  <Td align="end">{money.format(c.annualValue)}</Td>
                  <Td>{day.format(new Date(c.endDate))}</Td>
                  <Td>
                    <Badge tone={STATUS[c.status].tone}>{STATUS[c.status].label}</Badge>
                  </Td>
                  <Td>
                    {/* The two decisions, in place, on awaiting rows only. Peers,
                      * one per row of many — neither is primary. A decided row
                      * shows its status and nothing pressable. */}
                    {c.status === 'awaiting-review' && (
                      <Row gap={2}>
                        <Button size="sm" variant="secondary" onClick={() => decide(c.id, 'renewal-sent')}>
                          Send for renewal
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => decide(c.id, 'lapsing')}>
                          Let lapse
                        </Button>
                      </Row>
                    )}
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </TableScroll>
      </Card>
    </ListPageTemplate>
  )
}
