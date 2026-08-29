/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Meter } from './Meter'
import { Card } from '../Card'
import { Descriptions } from '../Descriptions'
import { Grid, GridItem } from '../Layout'
import { SectionLabel } from '../SectionLabel'
import { Stack } from '../Layout'

/* A METER IS A READING ON A SCALE. NOT A PROGRESS BAR. `Progress` answers "how
 * far along is this task, and will it finish"; a meter answers "where does this
 * number sit between the ends of its range", and the range exists whether
 * anything is happening or not — maturity out of three, storage out of a quota,
 * a score out of a hundred. If the bar would reach the end and then disappear,
 * it was a Progress.
 *
 * `target` is the line the reading is MEANT to reach, drawn on the scale
 * itself. Without it the reader has a number and no idea whether it is good,
 * which is the same trivia problem a KPI has without its comparison.
 *
 * `tone` says what the reading MEANS, and it does not come from the fill: 1.4
 * of 3 is short of target, so it is `warning`; the same 1.4 against a target of
 * 1 would be `success`. Colour picked from the percentage is a bar that
 * congratulates you for missing.
 *
 * `size` is density, not importance — `md` when the meter is the point of its
 * block, `sm` in a row of many where the reader is scanning for the odd one out.
 *
 * `label` is what assistive tech reads, so it carries the numbers: a bar
 * announced as "Maturity" tells a screen reader nothing. It is NOT drawn — a
 * row of meters with nothing beside them is a row of anonymous bars, so the
 * name a sighted reader needs comes from what the meters sit in.
 */
export function Example() {
  return (
    <Grid columns={12}>
      <GridItem span={6}>
        <Card>
          <Stack gap={6}>
            <Stack gap={2}>
              <SectionLabel as="h3">Delivery maturity</SectionLabel>
              <Meter value={1.4} max={3} target={2} tone="warning" ticks={[0, 1, 2, 3]} label="Maturity 1.4 of 3, target 2" />
            </Stack>

            {/* A row of readings on one scale: small, named, scanned rather than
                studied. <Descriptions> supplies the names, because `label` is
                only spoken. */}
            <Stack gap={2}>
              <SectionLabel as="h3">By team</SectionLabel>
              <Descriptions
                items={[
                  { term: 'Platform', value: <Meter value={2.6} max={3} target={2} tone="success" size="sm" label="Platform 2.6 of 3, target 2" /> },
                  { term: 'Payments', value: <Meter value={2.1} max={3} target={2} tone="success" size="sm" label="Payments 2.1 of 3, target 2" /> },
                  { term: 'Identity', value: <Meter value={0.9} max={3} target={2} tone="danger" size="sm" label="Identity 0.9 of 3, target 2" /> },
                ]}
              />
            </Stack>
          </Stack>
        </Card>
      </GridItem>
    </Grid>
  )
}
