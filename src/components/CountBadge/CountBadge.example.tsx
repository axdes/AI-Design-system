/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { CountBadge } from './CountBadge'
import { IconButton } from '../IconButton'
import { Tooltip } from '../Tooltip'

export function Example() {
  /* A count pinned to a control. Pass `label` so the number is announced; use
   * `dot` for a plain unread marker. This is NOT <Badge> (a standalone pill). */
  return (
    <CountBadge count={5} label="5 notifications">
      <Tooltip content="Notifications">
        <IconButton icon="message" aria-label="Notifications" />
      </Tooltip>
    </CountBadge>
  )
}
