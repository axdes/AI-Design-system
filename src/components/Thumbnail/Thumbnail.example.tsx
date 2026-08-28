/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Thumbnail } from './Thumbnail'
import { Table, TableScroll, TBody, Td, Th, THead, Tr } from '../Table'

const ROWS = [
  { id: 'Quarterly report', kind: 'PDF', icon: 'description' as const },
  { id: 'Site walkthrough', kind: 'Video', icon: 'movie' as const },
]

export function Example() {
  return (
    <TableScroll label="Files">
      <Table caption="Files" captionHidden>
        <THead>
          <Tr>
            {/* The thumbnail column is as wide as the box and no wider. */}
            <Th width="4rem"><span className="sr-only">Preview</span></Th>
            <Th>File</Th>
            <Th>Kind</Th>
          </Tr>
        </THead>
        <TBody>
          {ROWS.map((r) => (
            <Tr key={r.id}>
              {/* No src here: the fallback keeps the column one width, which is
                  what stops a row without a picture from collapsing. */}
              <Td><Thumbnail alt="" icon={r.icon} size="sm" /></Td>
              <Th scope="row" emphasis>{r.id}</Th>
              <Td>{r.kind}</Td>
            </Tr>
          ))}
        </TBody>
      </Table>
    </TableScroll>
  )
}
