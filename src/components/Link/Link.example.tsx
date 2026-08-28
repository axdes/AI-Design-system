/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Link } from './Link'

export function Example() {
  /* In a paragraph the link is brand-coloured AND underlined: inside a line of
   * text there is nothing else marking it, and colour on its own is not a mark
   * everyone can see. `quiet` is the other case — a link in chrome, where its
   * position already says what it is. */
  return (
    <p className="link-example-prose">
      Everything the workspace publishes is listed in the{' '}
      <Link href="/reports">report library</Link>, and the retention rules are
      in the <Link href="https://example.com/policy" external>data policy</Link>.
      {' '}
      {/* `arrow` is for a link that CONTINUES the reading, standing on its own
        * line. Inside the sentence above it would land mid-line and read as
        * punctuation nobody typed. */}
      <Link href="/reports/q4" arrow>Read more</Link>
    </p>
  )
}
