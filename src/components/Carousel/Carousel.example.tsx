/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Carousel } from './Carousel'
import { Card, CardTitle } from '../Card'

/* Each slide is whatever the product puts there; the carousel only owns the
 * track, the buttons and the dots. autoPlay is left off: a slideshow that moves
 * on its own takes the page away from whoever is reading it, so it has to be an
 * explicit decision (and it stops entirely under prefers-reduced-motion). */
const STORIES = [
  { id: 'nordwind', title: 'Nordwind', quote: 'Two weeks from brief to a working prototype.' },
  { id: 'kestrel', title: 'Kestrel Labs', quote: 'The review pass caught what our own checklist did not.' },
  { id: 'aurora', title: 'Aurora Health', quote: 'One design system across four products.' },
]

export function Example() {
  return (
    <Carousel
      label="Customer stories"
      items={STORIES.map((s) => ({
        id: s.id,
        content: (
          <Card>
            <CardTitle as="h3">{s.title}</CardTitle>
            <p>{s.quote}</p>
          </Card>
        ),
      }))}
    />
  )
}
