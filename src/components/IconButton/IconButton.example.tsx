/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { IconButton } from './IconButton'
import { Tooltip } from '../Tooltip'

export function Example() {
  /* Icon-only controls carry BOTH an aria-label (the accessible name) and a
   * Tooltip (the visible name on hover/focus). Neither is optional. */
  return (
    <Tooltip content="Delete">
      <IconButton icon="delete" tone="destructive" aria-label="Delete" onClick={() => undefined} />
    </Tooltip>
  )
}
