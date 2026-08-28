/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { CellStack } from './CellStack'
import { Table, TableScroll, TBody, Td, Th, THead, Tr } from '../Table'
import { money } from '../../lib/formatNumber'

const ROWS = [
  { id: 'INV-1042', supplier: 'Bergen Logistics', amount: 12140 },
  { id: 'INV-1043', supplier: 'Kestrel Studios', amount: 990 },
]

export function Example() {
  return (
    <TableScroll label="Invoices">
      <Table caption="Invoices" captionHidden>
        <THead>
          <Tr>
            <Th>Invoice</Th>
            {/* The unit is named once, in the header, not in two hundred cells. */}
            <Th align="end">Amount (EUR)</Th>
          </Tr>
        </THead>
        <TBody>
          {ROWS.map((r) => (
            <Tr key={r.id}>
              {/* One column carries two facts; every other column stays one
                  line, or the table stops scanning as rows. */}
              <Th scope="row" emphasis>
                <CellStack secondary={r.supplier}>{r.id}</CellStack>
              </Th>
              <Td align="end">{money(r.amount, { currency: false })}</Td>
            </Tr>
          ))}
        </TBody>
      </Table>
    </TableScroll>
  )
}
