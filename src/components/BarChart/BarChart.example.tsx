/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { BarChart } from './BarChart'
import { Card } from '../Card'
import { Grid, GridItem, Stack } from '../Layout'
import { SectionLabel } from '../SectionLabel'

/* One number per period, oldest first. */
const CLOSED = [
  { label: 'Apr', value: 34 },
  { label: 'May', value: 41 },
  { label: 'Jun', value: 28 },
  { label: 'Jul', value: 47 },
  { label: 'Aug', value: 52 },
]

/* Categories, not periods: these have no order of their own. */
const BY_TEAM = [
  { label: 'Payments', value: 62 },
  { label: 'Identity and access', value: 48 },
  { label: 'Platform', value: 31 },
]

/* `orientation` IS DECIDED BY THE LABELS, NOT BY TASTE. `vertical` is for a
 * series with a natural order — months, weeks, releases — where left to right
 * IS time, and the reader is looking for a trend. `horizontal` is for
 * categories with no order and names too long to stand under a column: rotated
 * or wrapped labels under vertical bars are the commonest reason a chart cannot
 * be read at all.
 *
 * `target` draws the goal ACROSS the bars, which turns "short" into "short of
 * something". Without it a column is only shorter than its neighbour, and the
 * reader supplies a standard of their own.
 *
 * `emphasis` marks the one bar the sentence beside the chart is about — usually
 * the latest. Marking several marks none.
 *
 * `tone` is what the whole measure MEANS, and it belongs to the metric rather
 * than to the numbers: findings closed rising is `success`, incidents rising is
 * `danger`, and the same bars carry both.
 *
 * `size` is how much of the page the chart is worth: `md` when it is the block,
 * `sm` when it is one card in a grid of them.
 */
export function Example() {
  return (
    <Grid columns={12} gap={4}>
      <GridItem span={8}>
        <Card>
          <Stack gap={3}>
            <SectionLabel as="h3">Over time</SectionLabel>
            {/* Months have an order, so left to right is time. */}
            <BarChart
              data={CLOSED}
              target={40}
              emphasis="Aug"
              tone="success"
              /* `label` is what the chart measures. It names the chart for a
                 screen reader, which then reads the table the component
                 renders for it. */
              label="Findings closed per month"
            />
          </Stack>
        </Card>
      </GridItem>

      <GridItem span={4}>
        <Card>
          <Stack gap={3}>
            <SectionLabel as="h3">By team</SectionLabel>
            {/* No order and long names, so the bars lie down. */}
            <BarChart
              data={BY_TEAM}
              orientation="horizontal"
              size="sm"
              tone="warning"
              label="Open findings by team"
            />
          </Stack>
        </Card>
      </GridItem>
    </Grid>
  )
}
