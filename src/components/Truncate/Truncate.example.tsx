/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Truncate } from './Truncate'
import { Table, TableScroll, TBody, Td, Th, THead, Tr } from '../Table'

const ROWS = [
  { id: 'INV-1042', note: 'Bergen Logistics, quarterly review, held pending the signed addendum from the Rotterdam office' },
  { id: 'INV-1043', note: 'Kestrel Studios, single project' },
]

/* CLIPPING IS A PROMISE THAT THE REST IS REACHABLE. This measures the text and
 * gives a tooltip only when it actually overflows — the second row below has no
 * hover at all, because nothing was hidden from it. Clipping text the reader
 * cannot then read is worse than a wider column.
 *
 * `layout="fixed"` on the table is what makes truncation possible at all:
 * without it the column widens to fit the longest value and nothing is ever
 * clipped, so the component appears to do nothing.
 *
 * `lines` is how much of the value the reader needs to RECOGNISE it, not how
 * much fits. One line in a dense table, where the column is a scan target and
 * every row has to sit on the same baseline. Two where the value is a sentence
 * the reader is actually reading — a note, a description — and one line cuts it
 * before it has said anything. Past two, stop truncating and give it the room.
 */
export function Example() {
  return (
    <TableScroll label="Invoice notes">
      <Table layout="fixed" caption="Invoice notes" captionHidden>
        <THead>
          <Tr>
            <Th width="8rem">Invoice</Th>
            <Th width="16rem">Note</Th>
            <Th>Summary</Th>
          </Tr>
        </THead>
        <TBody>
          {ROWS.map((r) => (
            <Tr key={r.id}>
              <Th scope="row" emphasis>{r.id}</Th>
              {/* A scan target: one line, so every row sits on one baseline. */}
              <Td><Truncate>{r.note}</Truncate></Td>
              {/* A sentence being read: two lines, so it says something first. */}
              <Td><Truncate lines={2}>{r.note}</Truncate></Td>
            </Tr>
          ))}
        </TBody>
      </Table>
    </TableScroll>
  )
}
