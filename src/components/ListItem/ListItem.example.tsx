/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { ListItem } from './ListItem'

export function Example() {
  return (
    <ListItem onClick={() => undefined}>
      <strong>Ada Meridian</strong>
      <span> Product designer</span>
    </ListItem>
  )
}
