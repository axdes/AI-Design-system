/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Icon } from './Icon'
import { Row } from '../Layout'

/* SIZE IS THE JOB, not the taste. `sm` sits inline with a line of text and in
 * buttons — it is the default because that is where icons mostly are. `md` is
 * for navigation and list rows, where the glyph is a landmark the eye returns
 * to. `lg` and `xl` are for the one mark on an empty state or a page that has
 * nothing else on it; used in a row of controls they make everything beside
 * them look broken.
 *
 * An icon is DECORATION here and is hidden from screen readers. That is right
 * when words sit beside it, and wrong when the icon is the only thing carrying
 * the meaning — in that case the meaning belongs in an aria-label on the
 * CONTROL, which is what <IconButton> exists for.
 */
export function Example() {
  return (
    <Row gap={4} align="center">
      <Icon name="calendar" />
      <Icon name="calendar" size="md" />
      <Icon name="calendar" size="lg" />
      <Icon name="calendar" size="xl" />
    </Row>
  )
}
