/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Card, CardCorner, CardHeader, CardTitle, CardMeta } from './Card'
import { Badge } from '../Badge'
import { Button } from '../Button'
import { IconButton } from '../IconButton'
import { MetaItem } from '../MetaItem'
import { Tooltip } from '../Tooltip'

export function Example() {
  /* THE CARD ANATOMY, in reading order — copy this shape; a card that needs less stops early.
   *   1. eyebrow  what KIND of thing this is, with its status beside it
   *   2. title    its name, one step above body text (a tile is not a page)
   *   3. facts    what you opened the card to read
   *   4. meta     provenance and counts, pinned to the bottom */
  return (
    <Card interactive stretch tight>
      {/* Every card may carry its menu here, over the title's stretched hit area.
        * Icon-only, so it takes a Tooltip and an aria-label; wire it to a <Dropdown>. */}
      <CardCorner>
        <Tooltip content="More">
          <IconButton icon="more_vert" aria-label="More" size="sm" onClick={() => undefined} />
        </Tooltip>
      </CardCorner>

      <CardHeader>
        <MetaItem icon="description" appearance="eyebrow">Design sprint</MetaItem>
        <Badge tone="warning" fill="soft">In review</Badge>
      </CardHeader>

      {/* THE WHOLE CARD OPENS IT: `.card-link` stretches this control over the tile, so there is
        * one accessible name and one focus stop. Other buttons inside carry `.card-above`. */}
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
