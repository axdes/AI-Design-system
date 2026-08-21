/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Button } from '../../components/Button'
import { Card, CardTitle } from '../../components/Card'
import { Icon } from '../../components/Icon'
import { AdaptiveListPage } from './AdaptiveListPage'

const ITEMS = [{ id: 'w1', name: 'Kickoff' }, { id: 'w2', name: 'Retro' }]

export function Example() {
  /* Same action twice, one size up for the welcome layout's big CTA. */
  const add = (size?: 'lg') => (
    <Button size={size} onClick={() => undefined}>
      <Icon name="add" />
      New workshop
    </Button>
  )

  return (
    <AdaptiveListPage
      title="Workshops"
      subtitle="Run a session, or open one you already have."
      count={ITEMS.length}
      actions={add()}
      cta={add('lg')}
      empty={{ icon: 'presentation', title: 'No workshops yet', action: add('lg') }}
    >
      {/* The ref goes on the grid: it is what the block measures to choose
          between the welcome layout and the standard one. */}
      {(gridRef) => (
        <div className="list-cluster-grid" ref={gridRef}>
          {ITEMS.map((i) => (
            <Card key={i.id} interactive fill tight>
              <CardTitle as="h2">{i.name}</CardTitle>
            </Card>
          ))}
        </div>
      )}
    </AdaptiveListPage>
  )
}
