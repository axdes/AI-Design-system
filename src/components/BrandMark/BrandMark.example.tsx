/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { BrandMark } from './BrandMark'
import { Logo } from '../../shell/Logo'
import { Row, Stack } from '../Layout'
import { SectionLabel } from '../SectionLabel'

/* THE SAME PICTURE IN BOTH RAIL STATES, and `direction` is which of the two it
 * is. The circle never leaves, so the brand does not change shape when the rail
 * does — a mark that becomes a different mark reads as a different product.
 *
 * The slot CANNOT ASK the rail which state it is in, so it is told. Pass this
 * in both `<SideNav logo>` and `<SideNav logoMark>`: expanded it caps the mark
 * beside the wordmark and its arrow points inward, because pressing it
 * collapses; collapsed it is the whole of what the rail shows and its arrow
 * points outward, because pressing it opens. Give both slots the same
 * `direction` and one of them is an arrow that lies about what it does.
 *
 * The ink is `inverse` because the mark now sits on a brand fill: the cap is
 * the surface, and a logo drawn for white paper disappears on it.
 */
export function Example() {
  return (
    <Row gap={8} align="start">
      <Stack gap={2}>
        <SectionLabel as="h3">Expanded rail</SectionLabel>
        {/* Beside the wordmark; the arrow points in, because it closes. */}
        <BrandMark direction="collapse"><Logo size={22} tone="inverse" /></BrandMark>
      </Stack>

      <Stack gap={2}>
        <SectionLabel as="h3">Collapsed rail</SectionLabel>
        {/* All the rail shows; the arrow points out, because it opens. */}
        <BrandMark direction="expand"><Logo size={22} tone="inverse" /></BrandMark>
      </Stack>
    </Row>
  )
}
