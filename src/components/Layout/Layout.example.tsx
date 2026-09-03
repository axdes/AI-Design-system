/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Grid, GridItem, Row, Stack } from './index'
import { Button } from '../Button'
import { Card, CardTitle } from '../Card'

export function Example() {
  const cards = ['Drafts', 'In review', 'Published']

  /* Spacing lives on the container (gap), never as child margins. `gap` takes a
   * step of the 4pt scale: 1 | 2 | 3 | 4 | 6 | 8 | 12 | 16. */
  return (
    <Stack gap={6}>
      {/* A set of EQUALS: no columns, no spans — the tracks fit themselves. */}
      <Grid gap={4}>
        {cards.map((c) => (
          <Card key={c}><CardTitle>{c}</CardTitle></Card>
        ))}
      </Grid>
      {/* A set that is deliberately UNEQUAL: twelve tracks, each item saying how
          many it takes. 3 is a quarter, 6 a half, 9 three quarters, 12 the row. */}
      <Grid gap={4} columnCount={12}>
        <GridItem span={9}>
          <Card stretch><CardTitle>This quarter</CardTitle></Card>
        </GridItem>
        <GridItem span={3}>
          <Card stretch><CardTitle>Open items</CardTitle></Card>
        </GridItem>
      </Grid>
      <Row gap={2}>
        <Button variant="secondary">Cancel</Button>
        <Button variant="primary">Save</Button>
      </Row>
    </Stack>
  )
}
