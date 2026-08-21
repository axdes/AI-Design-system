/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Table, TableScroll, THead, TBody, Tr, Th, Td } from './Table'

export function Example() {
  return (
    /* Wrap when the columns will not fit a narrow viewport: the row scrolls
       sideways instead of squeezing. `label` names the tab stop that creates. */
    <TableScroll label="Adoption by dimension">
      <Table>
        <THead>
          <Tr><Th>Dimension</Th><Th>Level 1</Th><Th>Level 2</Th></Tr>
        </THead>
        <TBody>
          <Tr><Td emphasis>AI capabilities</Td><Td>Assisted</Td><Td tone="success">Agentic</Td></Tr>
          <Tr><Td emphasis>Daily active</Td><Td>Low</Td><Td tone="success">&gt;80%</Td></Tr>
        </TBody>
      </Table>
    </TableScroll>
  )
}
