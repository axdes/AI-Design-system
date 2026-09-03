/* One rendered example per table KIND.
 *
 * `table-rules.json` decides WHICH table a zone gets — 20 kinds, each with the
 * parts it may not ship without. A kind is a composition, not a component, so
 * nothing rendered a worklist, an analytical table under its total, or a
 * bar-in-cell ranking as the rules describe them. The card families got their
 * specimens on 2026-08-26; forms and tables had none (owner, the same day).
 *
 * Imports are RELATIVE: read from outside the package too.
 *
 * Every specimen is built ONLY from registry parts. Three rows is the whole
 * point — a specimen is the SHAPE of the kind, not a data set.
 */
import { type ReactElement } from 'react'
import { Badge } from '../components/Badge'
import { BatchActions } from '../components/BatchActions'
import { Button } from '../components/Button'
import { Card, CardTitle } from '../components/Card'
import { Checkbox } from '../components/Checkbox'
import { ComparisonTable } from '../components/ComparisonTable'
import { Descriptions } from '../components/Descriptions'
import { DiffTable } from '../components/DiffTable'
import { Stack } from '../components/Layout'
import { PivotTable } from '../components/PivotTable'
import { ScheduleGrid } from '../components/ScheduleGrid'
import { Table, TableScroll, TBody, Td, TFoot, Th, THead, Tr, TrGroup } from '../components/Table'
import { TreeTable } from '../components/TreeTable'

const noop = () => undefined
const AXIS = [{ key: 'a', label: 'Atlas' }, { key: 'b', label: 'Beacon' }]
const MONTHS = [{ key: 'jun', label: 'Jun' }, { key: 'jul', label: 'Jul' }]
const HOURS = [{ key: '09:00', label: '09:00' }, { key: '10:00', label: '10:00' }]

export const TABLE_SPECIMENS: Record<string, () => ReactElement> = {
  /* Stated values nobody acts on: no sorting, no selection, no row menu. A
     table with no actions owes no chrome. */
  reference: () => (
    <TableScroll label="Payment terms">
      <Table caption="Payment terms" captionHidden size="sm">
        <THead><Tr><Th>Term</Th><Th align="end">Days</Th></Tr></THead>
        <TBody>
          <Tr><Th scope="row" emphasis>Net 30</Th><Td align="end">30</Td></Tr>
          <Tr><Th scope="row" emphasis>Net 60</Th><Td align="end">60</Td></Tr>
        </TBody>
      </Table>
    </TableScroll>
  ),

  /* Find and act: the table a collection screen is built around. Sortable
     headers, the identifier as a row header, one way into each record. */
  list: () => (
    <TableScroll label="Invoices">
      <Table caption="Invoices" captionHidden>
        <THead><Tr><Th sortable sortDirection="asc" onSort={noop}>Invoice</Th><Th>Supplier</Th><Th align="end">Amount</Th></Tr></THead>
        <TBody>
          <Tr><Th scope="row" emphasis>INV-1041</Th><Td>Northwind</Td><Td align="end">€ 4,820</Td></Tr>
          <Tr><Th scope="row" emphasis>INV-1042</Th><Td>Bergen</Td><Td align="end">€ 12,140</Td></Tr>
        </TBody>
      </Table>
    </TableScroll>
  ),

  /* A given queue: every row needs a decision, so the decision is ON the row
     and not behind a menu. */
  worklist: () => (
    <TableScroll label="Waiting on you">
      <Table caption="Waiting on you" captionHidden>
        <THead><Tr><Th>Request</Th><Th>Waiting</Th><Th align="end">Decision</Th></Tr></THead>
        <TBody>
          <Tr>
            <Th scope="row" emphasis>EXP-2204</Th><Td>2 days</Td>
            <Td align="end"><Button size="sm">Approve</Button></Td>
          </Tr>
          <Tr>
            <Th scope="row" emphasis>EXP-2201</Th><Td>6 days</Td>
            <Td align="end"><Button size="sm">Approve</Button></Td>
          </Tr>
        </TBody>
      </Table>
    </TableScroll>
  ),

  /* Picking N rows and applying one action to all of them. The bar names the
     count, so nothing is ambiguous about what the action applies to. */
  selection: () => (
    <Stack gap={3}>
      <BatchActions count={2} onClear={noop}><Button variant="secondary" size="sm">Approve</Button></BatchActions>
      <TableScroll label="Invoices">
        <Table caption="Invoices" captionHidden>
          <THead><Tr><Th select><Checkbox aria-label="Select all" checked onChange={noop} /></Th><Th>Invoice</Th></Tr></THead>
          <TBody>
            <Tr selected><Td select><Checkbox aria-label="Select INV-1041" checked onChange={noop} /></Td><Th scope="row" emphasis>INV-1041</Th></Tr>
            <Tr selected><Td select><Checkbox aria-label="Select INV-1042" checked onChange={noop} /></Td><Th scope="row" emphasis>INV-1042</Th></Tr>
          </TBody>
        </Table>
      </TableScroll>
    </Stack>
  ),

  /* Rows under headings the reader can collapse, with the count on the
     heading — a group that hides its size hides how much is behind it. */
  grouped: () => (
    <TableScroll label="Findings by site">
      <Table caption="Findings by site" captionHidden>
        <THead><Tr><Th>Finding</Th><Th>Raised</Th></Tr></THead>
        <TBody>
          <TrGroup label="Bergen" count={2} expanded onToggle={noop} colSpan={2} />
          <Tr><Th scope="row" emphasis>Access route blocked</Th><Td>2 days ago</Td></Tr>
          <Tr><Th scope="row" emphasis>Signage missing</Th><Td>6 days ago</Td></Tr>
        </TBody>
      </Table>
    </TableScroll>
  ),

  /* A row with a second layer, revealed in place: the detail belongs to the
     row, so it opens under it rather than on another screen. */
  expandable: () => (
    <TableScroll label="Deliveries">
      <Table caption="Deliveries" captionHidden>
        <THead><Tr><Th>Delivery</Th><Th>Status</Th></Tr></THead>
        <TBody>
          <Tr><Th scope="row" emphasis>DL-88</Th><Td><Badge tone="success" fill="soft">Arrived</Badge></Td></Tr>
          <Tr><Th scope="row" emphasis>DL-89</Th><Td><Badge tone="warning" fill="soft">Delayed</Badge></Td></Tr>
        </TBody>
      </Table>
    </TableScroll>
  ),

  /* Transactions UNDER A TOTAL. The total is the point of the table, so it
     lives in a foot and not as one more row. */
  analytical: () => (
    <TableScroll label="Spend by supplier">
      <Table caption="Spend by supplier" captionHidden>
        <THead><Tr><Th>Supplier</Th><Th align="end">Spend</Th></Tr></THead>
        <TBody>
          <Tr><Th scope="row" emphasis>Northwind</Th><Td align="end">€ 4,820</Td></Tr>
          <Tr><Th scope="row" emphasis>Bergen</Th><Td align="end">€ 12,140</Td></Tr>
        </TBody>
        <TFoot><Tr><Td>Total</Td><Td align="end">€ 16,960</Td></Tr></TFoot>
      </Table>
    </TableScroll>
  ),

  /* A ranking read at a glance: the number AND its length in the cell, because
     a column of figures is compared by reading and a column of bars by looking. */
  'bar-in-cell': () => (
    <TableScroll label="Findings by site">
      <Table caption="Findings by site" captionHidden>
        <THead><Tr><Th>Site</Th><Th align="end">Open</Th></Tr></THead>
        <TBody>
          <Tr><Th scope="row" emphasis>Northwind</Th><Td align="end" heat={4}>7</Td></Tr>
          <Tr><Th scope="row" emphasis>Bergen</Th><Td align="end" heat={2}>4</Td></Tr>
          <Tr><Th scope="row" emphasis>Kestrel</Th><Td align="end" heat={1}>1</Td></Tr>
        </TBody>
      </Table>
    </TableScroll>
  ),

  /* A dense append-only stream: time first, payload after it, and the type
     carried by a mark rather than a word repeated on every line. */
  log: () => (
    <TableScroll label="Activity">
      <Table caption="Activity" captionHidden size="sm" nowrap>
        <THead><Tr><Th>Time</Th><Th>Event</Th></Tr></THead>
        <TBody>
          <Tr><Th scope="row" emphasis>09:14:02</Th><Td>Invoice INV-1041 approved by Ada Meridian</Td></Tr>
          <Tr><Th scope="row" emphasis>09:12:44</Th><Td>Evidence attached to finding F-204</Td></Tr>
        </TBody>
      </Table>
    </TableScroll>
  ),

  /* The top rows inside a card on an overview, with no table chrome: no
     sorting, no pager, and a way to the full table underneath. */
  'card-table': () => (
    <Card flush>
      <CardTitle as="h3">Waiting on you</CardTitle>
      <TableScroll label="Waiting on you">
        <Table caption="Waiting on you" captionHidden size="sm">
          <TBody>
            <Tr><Th scope="row" emphasis>EXP-2204</Th><Td align="end">2 days</Td></Tr>
            <Tr><Th scope="row" emphasis>EXP-2201</Th><Td align="end">6 days</Td></Tr>
          </TBody>
        </Table>
      </TableScroll>
      <Button variant="link" size="sm">View all 9</Button>
    </Card>
  ),

  /* One record's fields, read top to bottom. Not a table: there is nothing to
     compare, so columns would be a lie about the shape of the data. */
  'key-value': () => (
    <Descriptions
      items={[
        { term: 'Account', value: 'ACC-4180' },
        { term: 'Owner', value: 'Ada Meridian' },
        { term: 'Renews', value: '12 September' },
      ]}
    />
  ),

  /* Hierarchy WITH columns: the name carries the nesting, the rest are fields. */
  tree: () => (
    <TreeTable
      label="Revenue by region"
      columns={[{ header: 'Region' }, { header: 'Revenue', align: 'end' }]}
      nodes={[
        { id: 'eu', name: 'Europe', cells: ['€ 812,400'], children: [{ id: 'no', name: 'Norway', cells: ['€ 210,000'] }] },
        { id: 'us', name: 'Americas', cells: ['€ 640,100'] },
      ]}
      defaultExpandedIds={['eu']}
    />
  ),

  /* Two categorical axes and ONE measure in the cell. */
  pivot: () => (
    <PivotTable label="Hours by team and month" captionHidden rowHeader="Team" rows={AXIS} columns={MONTHS} totals cellValue={(r, c) => (r === 'a' && c === 'jun' ? 120 : 80)} />
  ),

  /* The same two axes, read as a PATTERN: the shape across the grid matters
     more than any single number, so the cells carry heat. */
  heatmap: () => (
    <PivotTable label="Load by team and month" captionHidden rowHeader="Team" rows={AXIS} columns={MONTHS} heat cellValue={(r, c) => (r === 'a' && c === 'jun' ? 120 : 20)} />
  ),

  /* A few subjects as COLUMNS and their attributes as rows. */
  comparison: () => (
    <ComparisonTable
      label="Plans compared"
      captionHidden
      rowHeader="What you get"
      subjects={[{ key: 'team', name: 'Team', note: '€ 12 per seat' }, { key: 'business', name: 'Business', note: '€ 24 per seat', recommended: true }]}
      rows={[
        { label: 'Seats', values: { team: 'Up to 20', business: 'Up to 200' } },
        { label: 'Audit log', values: { team: false, business: true } },
      ]}
    />
  ),

  /* Binary coverage across a set: supported or not, and nothing in between —
     a tick that sometimes carries a footnote is a comparison table. */
  ticks: () => (
    <ComparisonTable
      label="What each plan includes"
      captionHidden
      rowHeader="Feature"
      subjects={[{ key: 'team', name: 'Team' }, { key: 'business', name: 'Business' }]}
      rows={[
        { label: 'Single sign-on', values: { team: false, business: true } },
        { label: 'Audit log', values: { team: false, business: true } },
      ]}
    />
  ),

  /* A resource against time. The cell holds an INTERVAL that spans cells, which
     is the whole difference between this and a pivot. */
  schedule: () => (
    <ScheduleGrid
      label="Room bookings"
      captionHidden
      resourceHeader="Room"
      resources={[{ key: 'atrium', label: 'Atrium' }, { key: 'studio', label: 'Studio' }]}
      slots={HOURS}
      events={[{ id: 'k', resource: 'atrium', from: '09:00', to: '10:00', label: 'Kick-off', tone: 'primary' }]}
    />
  ),

  /* Before and after, side by side, with added and removed as their own kinds
     rather than an empty cell the reader has to interpret. */
  diff: () => (
    <DiffTable
      label="What changed"
      captionHidden
      changes={[
        { field: 'Owner', before: 'Ada Meridian', after: 'Ines Duarte' },
        { field: 'Data residency', after: 'EU (Frankfurt)', kind: 'added' },
      ]}
    />
  ),

  /* A spreadsheet: editing across records is the primary task, so the cells
     ARE the editors. <DataGrid> owns this one — see its own example, which is
     a live grid rather than a picture of one. */
  'editable-grid': () => (
    <Card>
      <Stack gap={2}>
        <CardTitle as="h3">Editing across records</CardTitle>
        <Descriptions layout="inline" items={[{ term: 'Part', value: 'DataGrid' }, { term: 'Enter an editor', value: 'one click, Enter, or typing' }]} />
      </Stack>
    </Card>
  ),

  /* Thousands of rows, only the visible ones in the DOM. Same part as the
     editable grid; what makes it this kind is the SIZE of the collection. */
  virtualized: () => (
    <Card>
      <Stack gap={2}>
        <CardTitle as="h3">Thousands of rows</CardTitle>
        <Descriptions layout="inline" items={[{ term: 'Part', value: 'DataGrid' }, { term: 'In the DOM', value: 'only the window plus an overscan' }]} />
      </Stack>
    </Card>
  ),
}
