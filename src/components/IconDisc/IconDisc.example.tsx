/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { IconDisc } from './IconDisc'
import { Row } from '../Layout'

/* The choice this part leaves you is the DISC and the fill — never the glyph
 * inside it. `md` marks a section or a tile; `sm` sits inline with a line of
 * text. `primary` is for the one mark that is the brand itself; a screen of
 * brand-filled discs is a screen with no emphasis left. */
export function Example() {
  return (
    <Row gap={3} align="center">
      <IconDisc icon="campaign" />
      <IconDisc icon="campaign" tone="primary" />
      <IconDisc icon="campaign" size="sm" />
    </Row>
  )
}
