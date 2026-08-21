/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Card, CardHeader, CardTitle, CardMeta } from './Card'
import { Badge } from '../Badge'
import { Button } from '../Button'
import { MetaItem } from '../MetaItem'

export function Example() {
  /* THE CARD ANATOMY, in the order the levels are read. Copy this shape; a card that needs less
   * stops early rather than inventing its own arrangement.
   *
   *   1. eyebrow  what KIND of thing this is, with its status beside it
   *   2. title    its name, one step above body text (a tile is not a page)
   *   3. facts    what you opened the card to read
   *   4. meta     provenance and counts, pinned to the bottom behind a hairline
   *
   * The ladder is what makes a card scannable. The previous example was a title and one grey
   * line, so every product invented its own arrangement and all of them came out as a shouting
   * name over a stack of identical grey lines. */
  return (
    <Card interactive fill tight>
      <CardHeader>
        <MetaItem icon="description" appearance="eyebrow">Design sprint</MetaItem>
        <Badge tone="warning" fill="soft">In review</Badge>
      </CardHeader>

      {/* THE WHOLE CARD OPENS IT, and the title is what does the opening: `.card-link` stretches
        * this control's hit area over the tile, so there is one accessible name and one focus
        * stop instead of a click handler on the card div that no keyboard can reach. Buttons
        * that do something ELSE inside the card carry `.card-above`. */}
      <CardTitle>
        <Button variant="link" className="card-link" onClick={() => undefined}>Q3 onboarding guide</Button>
      </CardTitle>

      <p>Four sections drafted, the pricing one still open.</p>

      <CardMeta>
        <MetaItem icon="schedule">Updated 2 days ago</MetaItem>
        <MetaItem icon="group">3 editors</MetaItem>
      </CardMeta>

      {/* Its own action, over the stretched link rather than under it. */}
      <div className="card-above">
        <Button variant="secondary" size="sm" onClick={() => undefined}>Duplicate</Button>
      </div>
    </Card>
  )
}
