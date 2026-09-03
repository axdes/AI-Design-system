/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Card } from '../Card'
import { Grid, GridItem } from '../Layout'
import { Sparkline } from '../Sparkline'
import { Stat } from './Stat'

const sessions = [180, 176, 191, 188, 203, 214, 221]
const latency = [180, 186, 191, 205, 212, 224, 240]

/* A KPI IS FOUR LAYERS: what it is, what it reads, what it read before, and the
 * shape it made getting here. Drop the comparison and the number is trivia — a
 * reader cannot tell 221 sessions from a good week or a bad one.
 *
 * `deltaDirection` AND `deltaTone` ARE TWO DIFFERENT FACTS, which is why they
 * are two props. Direction is which way the number moved and comes from the
 * data. Tone is whether that is good news and comes from what is being counted:
 * both tiles below moved UP, and one of them is a problem. A component that
 * derived the colour from the arrow would paint every rising latency green.
 *
 * `flat` is a real reading, not a missing one. "No change" is what a reader
 * needs when they are checking whether something they did had an effect, and a
 * tile that hides it looks broken.
 *
 * `tone` colours the VALUE, and it is for the one tile a screen is built around
 * — a row where every tile is toned has no hierarchy, only noise.
 */
export function Example() {
  return (
    /* A KPI ROW IS A GRID, NOT A ROW. Three cards carrying sparklines are wider
       than their content suggests, and in a flex line the third one simply ran
       off the end of the page. Twelve tracks give each tile a third of the
       width and the row holds at any size. */
    <Grid columnCount={12} gap={4}>
      <GridItem span={4}>
        <Card>
          <Stat
            value="221"
            caption="Sessions this week"
            delta="+9% vs last week"
            deltaDirection="up"
            deltaTone="success"
            trend={<Sparkline values={sessions} tone="success" size="sm" area />}
          />
        </Card>
      </GridItem>

      {/* Same arrow, opposite news: the tone belongs to the metric. */}
      <GridItem span={4}>
        <Card>
          <Stat
            value="240"
            unit="ms"
            caption="p95 response time"
            delta="+33% vs last week"
            deltaDirection="up"
            deltaTone="danger"
            trend={<Sparkline values={latency} tone="danger" size="sm" />}
          />
        </Card>
      </GridItem>

      <GridItem span={4}>
        <Card>
          <Stat
            value="12"
            caption="Open incidents"
            delta="no change"
            deltaDirection="flat"
            deltaTone="neutral"
          />
        </Card>
      </GridItem>
    </Grid>
  )
}
