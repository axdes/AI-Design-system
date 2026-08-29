/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { Rating } from './Rating'
import { Row, Stack } from '../Layout'
import { SectionLabel } from '../SectionLabel'

/* `onChange` OR NOT IS THE DECISION, and it changes what the control IS. With
 * it the stars are a form field: clickable, reachable by keyboard, Arrow keys
 * move the score. Without it they are a READING — the score somebody else gave,
 * rendered as stars because a row of them is faster to compare than "4 of 5".
 *
 * Getting it the wrong way round is the mistake this component invites: an
 * interactive rating in a list of results invites a reader to change a score
 * that is not theirs, and a read-only one on a feedback form is a question with
 * no way to answer it.
 *
 * `size` follows which of those it is: `md` when rating is the task, `sm` in a
 * list row where the score is one column among several.
 */
export function Example() {
  const [score, setScore] = useState(4)

  return (
    <Stack gap={6}>
      <Stack gap={2}>
        <SectionLabel as="h3">Your rating</SectionLabel>
        <Rating label="Rate this article" value={score} onChange={setScore} />
      </Stack>

      {/* No onChange: these are other people's scores, and they are read. */}
      <Stack gap={2}>
        <SectionLabel as="h3">Recent reviews</SectionLabel>
        <Row gap={3} align="center">
          <span>Onboarding guide</span>
          <Rating size="sm" label="Rated 5 out of 5" value={5} />
        </Row>
        <Row gap={3} align="center">
          <span>Release checklist</span>
          <Rating size="sm" label="Rated 3 out of 5" value={3} />
        </Row>
      </Stack>
    </Stack>
  )
}
