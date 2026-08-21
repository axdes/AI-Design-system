/* The tempting wrong answer: a tidy table of destinations with a count
 * column. Every component and prop is real — only the decisions are wrong. */
import { ListPageTemplate } from '@/blocks/ListPageTemplate'
import { Button } from '@/components/Button'
import { Table, TableScroll, THead, TBody, Tr, Th, Td } from '@/components/Table'
import { Card } from '@/components/Card'

const AREAS = [
  { id: 'documents', name: 'Documents', count: 42 },
  { id: 'meetings', name: 'Meetings', count: 6 },
  { id: 'decisions', name: 'Decisions', count: 3 },
]

export function Screen() {
  return (
    <ListPageTemplate title="Acme Industrial workspace" panels>
      <Card flush>
        <TableScroll label="Workspace areas">
          <Table>
            <THead>
              <Tr>
                <Th>Area</Th>
                <Th align="end">Items</Th>
                <Th>Action</Th>
              </Tr>
            </THead>
            <TBody>
              {AREAS.map((a) => (
                <Tr key={a.id}>
                  <Td emphasis>{a.name}</Td>
                  <Td align="end">{a.count}</Td>
                  <Td>
                    <Button size="sm" variant="secondary">Open</Button>
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
