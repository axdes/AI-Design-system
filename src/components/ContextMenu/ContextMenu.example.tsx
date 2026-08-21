/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { ContextMenu } from './ContextMenu'
import { Card } from '../Card'

export function Example() {
  /* Right-click the target to open a menu at the pointer. For a left-click
   * trigger button use <Dropdown>. */
  return (
    <ContextMenu
      items={[
        { id: 'open', label: 'Open', icon: 'article', onSelect: () => undefined },
        { id: 'rename', label: 'Rename', icon: 'edit', onSelect: () => undefined },
        { id: 'delete', label: 'Delete', icon: 'delete', tone: 'destructive', onSelect: () => undefined },
      ]}
    >
      <Card>Right-click this card</Card>
    </ContextMenu>
  )
}
