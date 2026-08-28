/* One rendered example per CELL kind.
 *
 * `cell-rules.json` decides what a COLUMN holds — 18 kinds, each with the part
 * it is made of and the alignment, format and empty answer that go with it.
 * The three layers above it got their specimens on 2026-08-26; this is the
 * fourth and last, and it had none either.
 *
 * A cell is shown inside a real <Td>, because half of what a kind decides is
 * how it sits in a column: money and counts end the row on tabular figures, a
 * status is a mark and not a word repeated down the page, and an absent value
 * is SAID rather than left blank.
 *
 * Imports are RELATIVE: read from outside the package too.
 */
import { type ReactElement, type ReactNode } from 'react'
import { Badge } from '../components/Badge'
import { Checkbox } from '../components/Checkbox'
import { Identity } from '../components/Identity'
import { Link } from '../components/Link'
import { MenuIconButton } from '../components/MenuIconButton'
import { DropdownItem } from '../components/Dropdown'
import { Meter } from '../components/Meter'
import { Sparkline } from '../components/Sparkline'
import { Table, TableScroll, TBody, Td, Th, THead, Tr } from '../components/Table'
import { TagGroup } from '../components/TagGroup'
import { Thumbnail } from '../components/Thumbnail'
import { Time } from '../components/Time'

const noop = () => undefined

/* One column, three rows: a cell kind is only legible next to itself, because
   what it decides is how a COLUMN reads down the page, not how one value looks.
   The header is never empty — a column whose head says nothing is announced to
   a screen reader as a column of nothing, which axe reports as
   `empty-table-header` and which is exactly what an actions column usually
   is (caught here, 2026-08-26). Hide it visually if the design needs it; do
   not leave it out. */
const column = (header: string, cells: ReactNode[], align?: 'end') => (
  <TableScroll label={header}>
    <Table caption={header} captionHidden size="sm">
      <THead><Tr><Th align={align}>{header}</Th></Tr></THead>
      <TBody>{cells.map((c, i) => <Tr key={i}><Td align={align}>{c}</Td></Tr>)}</TBody>
    </Table>
  </TableScroll>
)

export const CELL_SPECIMENS: Record<string, () => ReactElement> = {
  /* What the row IS. It is a row HEADER, not a cell: it is how a screen reader
     says which record a value belongs to. */
  identifier: () => (
    <TableScroll label="Invoices">
      <Table caption="Invoices" captionHidden size="sm">
        <THead><Tr><Th>Invoice</Th><Th align="end">Amount</Th></Tr></THead>
        <TBody>
          <Tr><Th scope="row" emphasis>INV-1041</Th><Td align="end">€ 4,820</Td></Tr>
          <Tr><Th scope="row" emphasis>INV-1042</Th><Td align="end">€ 12,140</Td></Tr>
        </TBody>
      </Table>
    </TableScroll>
  ),

  /* A person as the value of a column: the face makes the row scannable, and
     the name still carries it for anyone who cannot see the face. */
  identity: () => column('Owner', [
    <Identity key="1" size="sm" src="/demo/avatar-ada.jpg" name="Ada Meridian" />,
    <Identity key="2" size="sm" src="/demo/avatar-ben.jpg" name="Ben Calloway" />,
  ]),

  /* A short value read as a word. Left, unformatted, and never truncated
     mid-word — a supplier called something else is a different supplier. */
  text: () => column('Supplier', ['Northwind Paper', 'Bergen Logistics']),

  /* A count. Ends the row on tabular figures, so the digits line up and the
     column can be compared by looking rather than reading. */
  number: () => column('Open', ['7', '41'], 'end'),

  /* An amount with its currency, aligned on the end and stated once in the
     header where the unit is the same all the way down. */
  money: () => column('Amount', ['€ 4,820', '€ 12,140'], 'end'),

  /* A share. The per-cent sign stays on the value, because a column headed
     "%" and holding bare numbers reads as a count on the first glance. */
  percent: () => column('Closed', ['96%', '38%'], 'end'),

  /* When something happens. One format down the whole column, and the year
     only when the column spans more than one. */
  date: () => column('Raised', [
    <Time key="1" value="2026-02-19" />,
    <Time key="2" value="2026-02-17" />,
  ]),

  /* How long AGO. The absolute time stays in the title, so "2 days ago" can be
     resolved to a date without leaving the row. */
  'relative-time': () => column('Last seen', [
    <Time key="1" value="2026-08-24T09:00:00Z" mode="relative" />,
    <Time key="2" value="2026-08-19T09:00:00Z" mode="relative" />,
  ]),

  /* Which state a record is in: a mark, not a sentence, and the same word for
     the same state everywhere. */
  status: () => column('Status', [
    <Badge key="1" tone="success" fill="soft">Paid</Badge>,
    <Badge key="2" tone="warning" fill="soft">Overdue</Badge>,
  ]),

  /* Several labels on one record, with the overflow counted rather than
     wrapped — a row that grows to fit its tags stops being a row. */
  tags: () => column('Areas', [
    <TagGroup key="1" max={2} items={['Safety', 'Access', 'Signage']} />,
    <TagGroup key="2" max={2} items={['Contract']} />,
  ]),

  /* Supported or not. A tick and an EMPTY cell, never a cross: two marks down a
     column read as two kinds of answer when there is only one. */
  boolean: () => column('Single sign-on', [
    <Badge key="1" tone="success" fill="soft">Yes</Badge>,
    <span key="2" aria-label="No">—</span>,
  ]),

  /* A value on a scale, compared DOWN the column: the bar is what makes the
     comparison possible without reading every number. */
  measure: () => column('Capacity', [
    <Meter key="1" value={62} max={100} label="Capacity 62 of 100" />,
    <Meter key="2" value={91} max={100} label="Capacity 91 of 100" tone="warning" />,
  ]),

  /* The SHAPE of a value over time. No axis: at this size a sparkline says
     "rising" or "falling", and anything it cannot say belongs in a chart. */
  trend: () => column('Last 12 weeks', [
    <Sparkline key="1" values={[3, 4, 6, 5, 8, 11]} label="Rising over twelve weeks" />,
    <Sparkline key="2" values={[9, 8, 8, 6, 4, 3]} label="Falling over twelve weeks" />,
  ]),

  /* A picture that identifies the row — small, square, and never the point of
     the row: it is how the eye finds the record it already knows. */
  media: () => column('File', [
    <Thumbnail key="1" src="/demo/coast.webp" alt="Coast road at dusk" size="sm" />,
    <Thumbnail key="2" alt="No preview" icon="description" size="sm" />,
  ]),

  /* A record that lives somewhere else. The words are the destination's own
     name, so a reader arriving there recognises where they are. */
  link: () => column('Contract', [
    <Link key="1" href="#">ACC-4180</Link>,
    <Link key="2" href="#">ACC-4181</Link>,
  ]),

  /* What can be done to this row, behind one glyph that names the ROW — "More
     actions" on six rows tells a screen-reader user nothing about which row. */
  actions: () => column('Actions', [
    <MenuIconButton key="1" label="Actions for INV-1041" size="sm">
      <DropdownItem onClick={noop}>Rename</DropdownItem>
    </MenuIconButton>,
    <MenuIconButton key="2" label="Actions for INV-1042" size="sm">
      <DropdownItem onClick={noop}>Rename</DropdownItem>
    </MenuIconButton>,
  ]),

  /* The checkbox that picks the row. Its accessible name says WHICH row, or a
     column of them is one control repeated. */
  select: () => column('Select', [
    <Checkbox key="1" aria-label="Select INV-1041" checked onChange={noop} />,
    <Checkbox key="2" aria-label="Select INV-1042" checked={false} onChange={noop} />,
  ]),

  /* No value, SAID OUT LOUD. A blank cell is indistinguishable from a cell that
     failed to load, so the absence is written and given an accessible name. */
  empty: () => column('Owner', [
    <Identity key="1" size="sm" name="Ada Meridian" />,
    <span key="2" aria-label="No owner yet">—</span>,
  ]),

}
