/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Divider } from './Divider'
import { Row, Stack } from '../Layout'

/* A DIVIDER IS FOR WHEN SPACE IS NOT ENOUGH. Two things a gap already separates
 * do not need a line between them, and a page of rules reads as a form from
 * 1998. Reach for it where the reader might otherwise carry meaning across the
 * boundary — the end of one record and the start of the next, a summary and the
 * detail under it.
 *
 * The LABELLED form is a different part with the same name: it does not divide
 * two sections, it says what the boundary MEANS. "OR" between two ways to sign
 * in tells the reader they are choosing, which a plain rule does not.
 *
 * `orientation="vertical"` needs a sized flex parent — a <Row> — because a line
 * with no height is not drawn. It is for separating things ON one line, where a
 * gap alone would let two groups of controls read as one.
 */
export function Example() {
  return (
    <Stack gap={4}>
      <p>Account details</p>
      <Divider />
      <p>Billing</p>

      {/* Not a boundary but a choice, so it carries the word. */}
      <Divider>OR</Divider>
      <p>Continue with SSO</p>

      {/* On one line: two groups that would otherwise read as one row. */}
      <Row gap={3} align="center">
        <span>Draft</span>
        <span>Edited 2 days ago</span>
        <Divider orientation="vertical" />
        <span>3 comments</span>
      </Row>
    </Stack>
  )
}
