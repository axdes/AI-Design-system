/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { DatePicker } from './DatePicker'
import { Card } from '../Card'
import { Field } from '../Field'
import { Stack } from '../Layout'

/* A FIELD THAT OPENS A CALENDAR, for a date the reader works OUT rather than
 * one they know. Picking "the second Tuesday after the handover" needs to see
 * the month; typing a birthday does not, and a calendar for it is thirty clicks
 * where three keystrokes would do. If the calendar is the screen rather than a
 * field on it, that is <Calendar>, and this component is the field around it.
 *
 * `min` and `max` BOUND the calendar: days outside them cannot be picked, which
 * is how a delivery date stops being in the past without an error message
 * appearing after the fact. Set them from the same rule the server enforces.
 *
 * `label` names the trigger for assistive tech and is not drawn — the visible
 * label comes from the <Field> around it, and both should say the same thing.
 *
 * `surface` names what is behind the trigger. On a `--muted` ground the white
 * fill already separates it, so the resting border comes off; on a card the
 * surface is white too, and `base` keeps the border that does the separating.
 */
export function Example() {
  const [delivery, setDelivery] = useState<Date>()
  const [review, setReview] = useState<Date | undefined>(new Date(2026, 0, 15))

  return (
    <Stack gap={6}>
      <Field label="Delivery date" htmlFor="delivery">
        <DatePicker
          id="delivery"
          label="Delivery date"
          surface="muted"
          value={delivery}
          onChange={setDelivery}
          min={new Date(2026, 0, 1)}
        />
      </Field>

      <Card>
        <Field label="Review on" htmlFor="review">
          <DatePicker id="review" label="Review on" value={review} onChange={setReview} />
        </Field>
      </Card>
    </Stack>
  )
}
