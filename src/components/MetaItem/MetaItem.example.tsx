/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { MetaItem } from './MetaItem'
import { Row, Stack } from '../Layout'

/* THE SAME PART, TWO PLACES IN A CARD, and `appearance` is which one. An
 * `eyebrow` sits ABOVE the title and says what KIND of thing this is — the
 * reader has not decided to care yet, so it is the first thing they read. The
 * default `meta` sits at the BOTTOM and carries provenance: when, by whom, how
 * many. Nobody reads those until they have decided the card is interesting.
 *
 * Getting it the wrong way round is not a styling mistake — it puts the counts
 * where the category belongs, and a reader scanning a grid of cards has to read
 * each one to find out what it is.
 *
 * The icon is decoration and is hidden from screen readers: the words beside it
 * already say it. An icon with no words beside it is not a meta item.
 */
export function Example() {
  return (
    <Stack gap={2}>
      <MetaItem icon="description" appearance="eyebrow">Design sprint</MetaItem>
      <Row gap={3}>
        <MetaItem icon="schedule">Updated 2 days ago</MetaItem>
        <MetaItem icon="group">3 editors</MetaItem>
        <MetaItem icon="text_fields">1,240 words</MetaItem>
      </Row>
    </Stack>
  )
}
