/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Tooltip } from './Tooltip'
import { IconButton } from '../IconButton'

/* Wrap a focusable child — the tooltip supplies the hover/focus text, the
 * IconButton keeps its own aria-label for assistive tech. */
export function Example() {
  return (
    <Tooltip content="Duplicate">
      <IconButton icon="content_copy" aria-label="Duplicate" />
    </Tooltip>
  )
}
