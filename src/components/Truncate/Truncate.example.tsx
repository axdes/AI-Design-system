/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Truncate } from './Truncate'
import { Table, TableScroll, TBody, Td, Th, THead, Tr } from '../Table'

const ROWS = [
  { id: 'INV-1042', note: 'Bergen Logistics, quarterly review, held pending the signed addendum from the Rotterdam office' },
  { id: 'INV-1043', note: 'Kestrel Studios, single project' },
]

export function Example() {
  return (
    /* `layout="fixed"` is what makes a truncation possible at all: without it
       the column widens to fit the longest value and nothing is ever clipped. */
    <TableScroll label="Invoice notes">
      <Table layout="fixed" caption="Invoice notes" captionHidden>
        <THead>
          <Tr>
            <Th width="8rem">Invoice</Th>
            <Th>Note</Th>
          </Tr>
        </THead>
        <TBody>
          {ROWS.map((r) => (
            <Tr key={r.id}>
              <Th scope="row" emphasis>{r.id}</Th>
              {/* The tooltip appears on the first row and not on the second:
                  it is measured, so a value that fits has no hover at all. */}
              <Td><Truncate>{r.note}</Truncate></Td>
            </Tr>
          ))}
        </TBody>
      </Table>
    </TableScroll>
  )
}
