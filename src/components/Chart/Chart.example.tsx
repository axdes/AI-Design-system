/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Chart } from './Chart'
import { Card } from '../Card'
import { Grid, GridItem, Stack } from '../Layout'
import { SectionLabel } from '../SectionLabel'

const MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug']

/* Categories, not periods: these have no order of their own. */
const TEAMS = ['Payments', 'Identity and access', 'Platform']

/* `type` IS THE ONE DECISION HERE, AND IT IS ABOUT THE DATA, NOT THE LOOK.
 * A LINE IS A CLAIM THAT THE POINTS ARE CONNECTED — that between April and May
 * the number passed through the values in between. Use it for something
 * measured over time. Categories are not connected, and joining them draws a
 * slope that does not exist; those are `type="bar"`.
 *
 * One entry per measure in `series`, each with a value per entry of `categories`,
 * oldest first. The slot colours are assigned in that order and never cycled,
 * so adding a third measure never repaints the first two.
 *
 * `orientation` (bars) IS DECIDED BY THE LABELS, NOT BY TASTE. `vertical` is
 * for a series with a natural order, where left to right IS time. `horizontal`
 * is for categories with no order and names too long to stand under a column:
 * rotated or wrapped categories are the commonest reason a chart cannot be read.
 *
 * `target` draws the goal ACROSS the plot, which turns "short" into "short of
 * something". Without it a mark is only shorter than its neighbour, and the
 * reader supplies a standard of their own.
 *
 * `emphasis` (bars) marks the one column the sentence beside the chart is
 * about, usually the latest. Marking several marks none.
 *
 * `area` fills under a SINGLE line, which reads as a volume. Two filled areas
 * overlapping is a chart nobody can read, so it is ignored past one series.
 *
 * `tone` is what the whole measure MEANS, and it belongs to the metric rather
 * than to the numbers: findings closed rising is `success`, incidents rising is
 * `danger`, and the same marks carry both.
 *
 * `size` is how much of the page the chart is worth: `md` when it is the block,
 * `sm` when it is one card in a grid of them.
 */
export function Example() {
  return (
    <Grid columnCount={12} gap={4}>
      <GridItem span={8}>
        <Card>
          <Stack gap={3}>
            <SectionLabel as="h3">Raised against closed</SectionLabel>
            {/* Two measures over time, so they are lines read at one x. */}
            <Chart
              type="line"
              categories={MONTHS}
              series={[
                { label: 'Raised', values: [52, 61, 48, 67, 72] },
                { label: 'Closed', values: [34, 41, 28, 47, 52] },
              ]}
              target={60}
              /* `label` is what the chart measures. It names the chart for a
                 screen reader, which then reads the table the component
                 renders for it. */
              label="Findings raised and closed per month"
            />
          </Stack>
        </Card>
      </GridItem>

      <GridItem span={4}>
        <Card>
          <Stack gap={3}>
            <SectionLabel as="h3">By team</SectionLabel>
            {/* No order and long names, so the bars lie down. */}
            <Chart
              categories={TEAMS}
              series={[{ label: 'Open findings', values: [62, 48, 31] }]}
              orientation="horizontal"
              size="sm"
              tone="warning"
              label="Open findings by team"
            />
          </Stack>
        </Card>
      </GridItem>

      <GridItem span={12}>
        <Card>
          <Stack gap={3}>
            <SectionLabel as="h3">Closed per month</SectionLabel>
            {/* Periods have an order, so left to right is time; the goal line
                and the accent on the latest column do the rest. */}
            <Chart
              categories={MONTHS}
              series={[{ label: 'Closed', values: [34, 41, 28, 47, 52] }]}
              target={40}
              emphasis="Aug"
              tone="success"
              label="Findings closed per month"
            />
          </Stack>
        </Card>
      </GridItem>
    </Grid>
  )
}
