/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { LineChart } from './LineChart'
import { Card } from '../Card'
import { Grid, GridItem, Stack } from '../Layout'
import { SectionLabel } from '../SectionLabel'

const MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug']

/* A LINE IS A CLAIM THAT THE POINTS ARE CONNECTED — that between April and May
 * the number passed through the values in between. Use it for something
 * measured over time. Categories are not connected, and joining them draws a
 * slope that does not exist; those are a <BarChart>.
 *
 * One entry per line, each with a value per label, oldest first. The slot
 * colours are assigned in that order and never cycled, so adding a third line
 * never repaints the first two.
 *
 * `target` is what makes a line readable as good or bad: without it the reader
 * sees movement and has to invent the standard themselves.
 *
 * `size` is how the chart is being read. `md` when it is the block and the
 * reader is comparing the lines; `sm` when it is a card in a grid and the shape
 * is the whole message — at that size a second line is usually one too many.
 *
 * `area` fills under a single line, which reads as a VOLUME. It suits one
 * accumulating quantity and is wrong under two lines, where the fills overlap
 * and the reader cannot tell which is in front.
 */
export function Example() {
  return (
    <Grid columns={12} gap={4}>
      <GridItem span={8}>
        <Card>
          <Stack gap={3}>
            <SectionLabel as="h3">Raised against closed</SectionLabel>
            <LineChart
              labels={MONTHS}
              series={[
                { label: 'Raised', values: [52, 61, 48, 67, 72] },
                { label: 'Closed', values: [34, 41, 28, 47, 52] },
              ]}
              target={60}
              label="Findings raised and closed per month"
            />
          </Stack>
        </Card>
      </GridItem>

      <GridItem span={4}>
        <Card>
          <Stack gap={3}>
            <SectionLabel as="h3">Sessions</SectionLabel>
            {/* One line, small, and the fill reads as accumulated volume. */}
            <LineChart
              labels={MONTHS}
              series={[{ label: 'Sessions', values: [180, 176, 191, 203, 221] }]}
              area
              size="sm"
              label="Sessions per month"
            />
          </Stack>
        </Card>
      </GridItem>
    </Grid>
  )
}
