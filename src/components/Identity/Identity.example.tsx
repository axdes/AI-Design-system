/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Identity } from './Identity'
import { Card } from '../Card'
import { Row, Stack } from '../Layout'
import { SectionLabel } from '../SectionLabel'

const AVATAR = `${import.meta.env.BASE_URL}demo/avatar-ben.jpg`

/* SIZE IS THE PERSON'S ROLE ON THE SCREEN, NOT A TASTE. When the person is one
 * cell of something else — a row, an assignee, a comment author — the face is
 * `sm` and the name carries it. When the person IS what the screen is about,
 * the face leads at `xl` or `2xl` and `vertical` stacks the name under it.
 * There is no middle position: an `xl` face inside a list row reads as the row
 * being more important than the ones above it.
 *
 * `secondary` is the line that tells the reader WHICH person this is when the
 * name alone does not — a role, a team, an email. Leave it out rather than fill
 * it with something they already know from the surrounding screen.
 *
 * `src` is optional on purpose: with no photograph the component draws initials
 * from `name` (or `avatarName`), so a missing avatar is a normal state and not
 * a broken image.
 */
export function Example() {
  return (
    <Row gap={8} align="start">
      {/* The person as the subject: the screen is about them, so the face leads
          and nothing frames it. */}
      <Identity src={AVATAR} name="Ada Meridian" secondary="Product designer" size="2xl" vertical />

      {/* The person as a cell: three rows, and none of them outweighs the list. */}
      <Card>
        <Stack gap={3}>
          <SectionLabel>Reviewers</SectionLabel>
          <Identity src={AVATAR} name="Ada Meridian" secondary="Design" size="sm" />
          <Identity name="Ben Torres" secondary="Engineering" size="sm" />
          <Identity name="Chen Wei" secondary="Research" size="sm" />
        </Stack>
      </Card>
    </Row>
  )
}
