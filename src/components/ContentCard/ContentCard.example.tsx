/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Button } from '../Button'
import { Card } from '../Card'
import { MetaItem } from '../MetaItem'
import { Stack } from '../Layout'
import { ContentCard } from './ContentCard'

/* A real photograph, shipped with the package (public/demo, licence noted
 * there). A media slot demonstrated with a flat rectangle shows neither the
 * crop, nor how the eyebrow reads over an image, nor that the slot takes a
 * picture at all — and an SVG without intrinsic width and height has no aspect
 * ratio, so it spilled over the text (2026-08-25). */
const PHOTO = `${import.meta.env.BASE_URL}demo/landscape.webp`

const ENTRIES = [
  { title: 'Two sites closed their findings early', meta: '19 February' },
  { title: 'The audit that slipped, and why', meta: '17 February' },
]

/* ONE component, both forms. Above, `layout` is left at `auto`, so the card is
 * a row in a sidebar and a tile in a grid without a second component and
 * without a media query — it reads its own width. Below, `layout="row"` is the
 * list form: no surface of its own, a hairline between neighbours, sitting
 * inside one flush <Card> rather than a stack of boxes. */
export function Example() {
  return (
    <Stack gap={6}>
      <ContentCard
        eyebrow="Report"
        title="The quarter in numbers, and what moved them"
        excerpt="Two sites closed their findings early, one audit slipped, and the reason turned out to be the same in both."
        media={<img src={PHOTO} alt="" width={640} height={360} />}
        meta={<MetaItem icon="schedule">19 February</MetaItem>}
        actions={<Button variant="link" size="sm">Read</Button>}
        onOpen={() => undefined}
      />
      <Card flush>
        {ENTRIES.map((e) => (
          <ContentCard
            key={e.title}
            layout="row"
            density="compact"
            title={e.title}
            meta={<MetaItem icon="schedule">{e.meta}</MetaItem>}
            onOpen={() => undefined}
          />
        ))}
      </Card>
    </Stack>
  )
}
