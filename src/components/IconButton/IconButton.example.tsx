/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { IconButton } from './IconButton'
import { Tooltip } from '../Tooltip'
import { Row } from '../Layout'

/* EVERY ONE OF THESE CARRIES BOTH an aria-label and a Tooltip. Neither is
 * optional and they are not the same thing: the label is what a screen reader
 * announces, the tooltip is what a sighted reader sees on hover. A control whose
 * only name is a picture has no name at all for half its audience.
 *
 * `variant` is how much the control competes with what surrounds it. `ghost` is
 * the default and the right answer nearly always — a toolbar of filled buttons
 * is a toolbar with no emphasis left. `filled` is for the one action a panel is
 * for. `quiet` is for a control inside content, where even a hover fill would
 * read as a second surface.
 *
 * `tone` is meaning, not decoration, and `destructive` is the only one that
 * changes what the reader should expect: it marks the action that cannot be
 * undone. It does not make a confirmation unnecessary.
 *
 * The label names the TARGET when a screen repeats the control — "Delete
 * invoice INV-1041", not "Delete", or a screen reader hears the same word
 * fourteen times down a table.
 */
export function Example() {
  return (
    <Row gap={2} align="center">
      <Tooltip content="Duplicate">
        <IconButton icon="content_copy" aria-label="Duplicate invoice INV-1041" onClick={() => undefined} />
      </Tooltip>
      <Tooltip content="Send">
        <IconButton icon="share" variant="filled" tone="primary" aria-label="Send invoice INV-1041" onClick={() => undefined} />
      </Tooltip>
      <Tooltip content="More">
        <IconButton icon="more_vert" variant="quiet" aria-label="More actions for INV-1041" onClick={() => undefined} />
      </Tooltip>
      <Tooltip content="Delete">
        <IconButton icon="delete" tone="destructive" aria-label="Delete invoice INV-1041" onClick={() => undefined} />
      </Tooltip>
    </Row>
  )
}
