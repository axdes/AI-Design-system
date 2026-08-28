/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Tooltip } from './Tooltip'
import { IconButton } from '../IconButton'
import { Button } from '../Button'
import { Row } from '../Layout'

/* A TOOLTIP NAMES A CONTROL, it does not explain one. One or two words, the
 * same verb the control would carry if it had room. If what you want to say is
 * a sentence, the reader needs it on the page, not on hover — a tooltip cannot
 * be reached by touch, cannot be selected, and disappears the moment the mouse
 * leaves.
 *
 * `placement` is the only choice, and it follows the room available rather than
 * the look: `top` above a control in a toolbar, `start`/`end` beside one at the
 * edge of a panel where a tooltip above it would be cut off. It is a preference,
 * not an instruction — the layer flips itself when the chosen side does not fit.
 *
 * On an icon-only control the tooltip is the VISIBLE name and the aria-label is
 * the announced one. Both, always: a tooltip is not reachable by a screen reader
 * and a label is not visible to anyone else.
 */
export function Example() {
  return (
    <Row gap={3} align="center">
      <Tooltip content="Duplicate">
        <IconButton icon="content_copy" aria-label="Duplicate" onClick={() => undefined} />
      </Tooltip>
      <Tooltip content="Archive" placement="bottom">
        <IconButton icon="folder" aria-label="Archive" onClick={() => undefined} />
      </Tooltip>
      <Tooltip content="Saves as you type" placement="end">
        <Button variant="secondary">Autosave</Button>
      </Tooltip>
    </Row>
  )
}
