/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Link } from './Link'
import { Card } from '../Card'
import { Row, Stack } from '../Layout'

/* `variant` IS ABOUT WHAT ELSE ON THE SCREEN SAYS "LINK".
 *
 * `primary` is a link INSIDE A SENTENCE: brand ink and an underline, because in
 * a line of text nothing else marks it, and colour on its own is not a mark
 * everyone can see.
 *
 * `quiet` is a link in CHROME — a breadcrumb, a row of meta, a footer — where
 * position already says what it is. It sits in secondary ink and underlines
 * when the pointer or the keyboard arrives.
 *
 * `bare` paints nothing, ever, because something else is the affordance: the
 * link wraps a whole SURFACE that lifts or highlights, and underlining the
 * words inside says a second time, badly, what the surface already said. The
 * anchor is still an anchor, so middle-click, copy-address and the keyboard all
 * keep working.
 *
 * `external` opens a new tab safely AND says so with a trailing glyph. Without
 * the glyph the new tab is a surprise, and the back button does not undo it.
 *
 * `arrow` is for a link that CONTINUES the reading and stands on its own line.
 * Inside a sentence it lands mid-line and reads as punctuation nobody typed.
 */
export function Example() {
  return (
    <Stack gap={6}>
      <p className="link-example-prose">
        Everything the workspace publishes is listed in the{' '}
        <Link href="/reports">report library</Link>, and the retention rules are
        in the <Link href="https://example.com/policy" external>data policy</Link>.
      </p>

      <Link href="/reports/q4" arrow>Read the Q4 report</Link>

      {/* Chrome: position already says these are links. */}
      <Row gap={3} align="center">
        <Link href="/reports" variant="quiet">Reports</Link>
        <span>/</span>
        <Link href="/reports/q4" variant="quiet">Q4</Link>
      </Row>

      {/* The whole card is the affordance, so the words carry no marking. */}
      <Card interactive>
        <Link href="/reports/q4" variant="bare">
          <strong>Q4 delivery report</strong>
        </Link>
      </Card>
    </Stack>
  )
}
