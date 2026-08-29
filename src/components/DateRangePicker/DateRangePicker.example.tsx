/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { DateRangePicker, type DateRange } from './DateRangePicker'
import { Card } from '../Card'
import { Field } from '../Field'
import { Stack } from '../Layout'

/* ONE DECISION, NOT TWO DATES. The first click marks the start, the second
 * closes with the range in order, and `onChange` only fires once both ends are
 * set — so the caller never holds half an answer. Two <DatePicker>s side by
 * side let a reader pick an end before a start and hand you a range that runs
 * backwards, and then somebody has to write the rule that catches it.
 *
 * Reach for two separate fields only when the ends are genuinely independent
 * facts — a contract's signing date and its renewal date are not a range, they
 * are two dates that happen to be ordered.
 *
 * `min` and `max` bound both ends. `label` names the trigger for assistive
 * tech; the visible label comes from the <Field> around it.
 *
 * `surface` names what is behind the trigger. On a `--muted` ground the white
 * fill already separates it, so the resting border comes off; on a card the
 * surface is white too, and `base` keeps the border that does the separating.
 */
export function Example() {
  const [stay, setStay] = useState<DateRange | undefined>()
  const [reporting, setReporting] = useState<DateRange | undefined>()

  return (
    <Stack gap={6}>
      <Field label="Stay dates" htmlFor="stay">
        <DateRangePicker
          label="Stay dates"
          surface="muted"
          placeholder="Select dates"
          value={stay}
          onChange={setStay}
        />
      </Field>

      <Card>
        <Field label="Reporting period" htmlFor="reporting">
          <DateRangePicker
            label="Reporting period"
            placeholder="Select a period"
            value={reporting}
            onChange={setReporting}
          />
        </Field>
      </Card>
    </Stack>
  )
}
