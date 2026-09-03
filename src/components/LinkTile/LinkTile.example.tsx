/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { LinkTile } from './LinkTile'
import { DropdownItem } from '../Dropdown'
import { MetaItem } from '../MetaItem'

export function Example() {
  const workshop = { id: 'w1', name: 'Discovery workshop', updated: '2 days ago' }

  /* One tile = one navigable record plus its overflow menu. The menu swallows
   * its own clicks, so the tile's onSelect does not fire behind it. */
  return (
    <LinkTile
      title={workshop.name}
      menuLabel={`Actions for ${workshop.name}`}
      onSelect={() => undefined}
      menu={
        <>
          <DropdownItem icon="edit" onClick={() => undefined}>Rename</DropdownItem>
          <DropdownItem icon="delete" onClick={() => undefined}>Delete</DropdownItem>
        </>
      }
    >
      <MetaItem icon="schedule">Updated {workshop.updated}</MetaItem>
    </LinkTile>
  )
}
