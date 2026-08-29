/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { ExpandButton } from './ExpandButton'
import { Card } from '../Card'
import { Row, Stack } from '../Layout'

/* THE CONTROL THAT OPENS SOMETHING ON THIS PAGE, with the rotation and the
 * `aria-expanded` wiring already done — which is the part hand-rolled versions
 * forget, and the part a screen reader depends on to say whether the thing is
 * open.
 *
 * `label` NAMES WHAT OPENS, NEVER THE DIRECTION. "Show the transcript" is a
 * label; "Expand" is a description of the arrow, and a reader who cannot see
 * the arrow gets nothing from it. The label does not change when the state
 * does — `aria-expanded` carries that, and a label that flips between "Show"
 * and "Hide" is announced twice on every press.
 *
 * `withChevron` is for a DISCLOSURE, where the caret is the promise that
 * something appears in place. Leave it off when the icon already says what
 * happens — a plus that adds, a filter that opens a panel — because a caret
 * beside a plus promises a menu that is not coming.
 *
 * `expanded` is only for a control whose state lives elsewhere, such as one
 * driving an open dropdown. Left alone the component owns it.
 */
export function Example() {
  const [open, setOpen] = useState(false)

  return (
    <Stack gap={4}>
      {/* A disclosure: the caret promises the panel below. */}
      <Card>
        <Stack gap={3}>
          <Row gap={3} align="center">
            <span>Design sprint, day one</span>
            <ExpandButton
              icon="article"
              label="Show the transcript"
              withChevron
              expanded={open}
              onClick={() => { setOpen((v) => !v) }}
            />
          </Row>
          {open && <p>Ada: let us start with what we learned from the pilot.</p>}
        </Stack>
      </Card>

      {/* No caret: the plus already says what pressing it does. */}
      <ExpandButton icon="add" label="Add a participant" />
    </Stack>
  )
}
