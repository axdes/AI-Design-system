/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { TableToolbar } from './TableToolbar'
import { Button } from '../Button'
import { Icon } from '../Icon'
import { SearchInput } from '../SearchInput'
import { Table, TableScroll, THead, TBody, Tr, Th, Td } from '../Table'

const ROWS = [
  { id: 'r-1', name: 'Q3 revenue review', owner: 'Ada Okonkwo', updated: '2 hours ago' },
  { id: 'r-2', name: 'Supplier audit', owner: 'Ines Duarte', updated: 'Yesterday' },
  { id: 'r-3', name: 'Headcount plan', owner: 'Ada Okonkwo', updated: '4 days ago' },
]

export function Example() {
  const [query, setQuery] = useState('')
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable')
  const rows = ROWS.filter((r) => r.name.toLowerCase().includes(query.toLowerCase()))

  return (
    <div>
      {/* The count is the filtered count: it is how the user knows the search
          did something when the rows scrolled out of view. */}
      <TableToolbar
        title="Documents"
        count={rows.length}
        actions={<Button size="sm">New document<Icon name="add" /></Button>}
        density={density}
        onDensityChange={setDensity}
      >
        <SearchInput expanded value={query} onChange={(e) => setQuery(e.target.value)} onClear={() => setQuery('')} placeholder="Search documents" />
      </TableToolbar>

      <TableScroll label="Documents">
        <Table caption="Documents, most recently updated first" captionHidden size={density === 'compact' ? 'sm' : undefined}>
          <THead>
            <Tr><Th>Document</Th><Th>Owner</Th><Th>Updated</Th></Tr>
          </THead>
          <TBody>
            {rows.map((r) => (
              <Tr key={r.id}>
                <Th scope="row" emphasis>{r.name}</Th>
                <Td>{r.owner}</Td>
                <Td>{r.updated}</Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </TableScroll>
    </div>
  )
}
