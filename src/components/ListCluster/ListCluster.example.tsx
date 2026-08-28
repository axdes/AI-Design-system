/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { ListCluster } from './ListCluster'
import { Button } from '../Button'
import { Card, CardTitle } from '../Card'
import { Grid } from '../Layout'
import { Icon } from '../Icon'

export function Example() {
  const items = [{ id: '1', name: 'Kickoff' }, { id: '2', name: 'Retro' }]

  /* The centered "welcome" list: one shape shared by every list screen, so they
   * cannot drift apart. Cards go in the middle, the primary CTA underneath. */
  return (
    <ListCluster
      title="Workshops"
      subtitle="Pick a workshop or start a new one."
      cta={<Button variant="primary" size="lg">New workshop<Icon name="add" /></Button>}
    >
      <Grid gap={4}>
        {items.map((i) => (
          <Card key={i.id} interactive><CardTitle>{i.name}</CardTitle></Card>
        ))}
      </Grid>
    </ListCluster>
  )
}
