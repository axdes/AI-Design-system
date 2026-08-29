/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { DonutChart } from './DonutChart'
import { Card } from '../Card'
import { Row, Stack } from '../Layout'
import { SectionLabel } from '../SectionLabel'

/* Shares of ONE whole, toned by what they MEAN: the ring answers "how much of
 * it is bad?", which is why the segments carry status tones rather than a
 * palette of unrelated hues. */
const FINDINGS = [
  { label: 'Closed', value: 214, tone: 'success' as const },
  { label: 'Open', value: 78, tone: 'warning' as const },
  { label: 'Overdue', value: 28, tone: 'danger' as const },
]

/* A DONUT IS FOR PARTS OF ONE WHOLE, and it is honest at three or four
 * segments. Past that the slices stop being comparable by eye and the reader is
 * reading the legend, which is a table with a picture on it. Numbers that are
 * not shares of anything — five teams' headcounts — are a <BarChart>.
 *
 * `center` is the WHOLE, so the ring has something to be a share of. Putting
 * the biggest segment there instead makes the other slices look like a
 * remainder.
 *
 * `size` follows the job. `md` when the ring is the block and the reader is
 * studying the split. `sm` beside a headline number in a card, where it is
 * saying "and this is how it breaks down" rather than being read precisely.
 *
 * `legend` and `percent` are about how the reader will USE it: turn the legend
 * off only when the segments are already named beside the chart, and turn
 * percentages on when the split is the point and the totals are not.
 */
export function Example() {
  return (
    <Row gap={4} align="start">
      <Card>
        <Stack gap={3}>
          <SectionLabel as="h3">Findings by state</SectionLabel>
          <DonutChart segments={FINDINGS} center="320" caption="findings" label="Findings by state" />
        </Stack>
      </Card>

      {/* Beside a headline, so it is small and speaks in shares. */}
      <Card>
        <Stack gap={3}>
          <SectionLabel as="h3">This quarter</SectionLabel>
          <DonutChart
            segments={FINDINGS}
            size="sm"
            percent
            center="320"
            caption="findings"
            label="Findings by state, this quarter"
          />
        </Stack>
      </Card>
    </Row>
  )
}
