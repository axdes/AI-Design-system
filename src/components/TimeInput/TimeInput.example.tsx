/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { TimeInput } from './TimeInput'
import { Card } from '../Card'
import { Field } from '../Field'
import { Row, Stack } from '../Layout'

/* A TIME OF DAY, NOT A LENGTH OF TIME. This holds "09:30" — a point on the
 * clock — and the reader's platform decides whether that shows as 09:30 or
 * 9:30 AM. A DURATION ("45 minutes") is a number with a unit, so it is a
 * <NumberInput> beside the word, and putting it here gives the reader a clock
 * for something that is not a clock.
 *
 * A time on its own is rarely the whole answer: a start with no end and no date
 * is a fact nobody can act on. Pair it with the other end, and give the pair
 * one <Field> so the label says what the RANGE is rather than naming two halves
 * the reader has to join up themselves.
 *
 * `surface` names what is behind the control. On a `--muted` ground the white
 * fill already separates it, so the resting border comes off; on a card the
 * surface is white too, and `base` keeps the border that does the separating.
 */
export function Example() {
  const [start, setStart] = useState('09:30')
  const [end, setEnd] = useState('10:15')
  const [reminder, setReminder] = useState('08:45')

  return (
    <Stack gap={6}>
      <Field label="Meeting time" htmlFor="starts">
        <Row gap={2} align="center" nowrap>
          <TimeInput id="starts" aria-label="Starts at" surface="muted" value={start} onChange={setStart} />
          <span>to</span>
          <TimeInput aria-label="Ends at" surface="muted" value={end} onChange={setEnd} />
        </Row>
      </Field>

      <Card>
        <Field label="Send the reminder at" htmlFor="reminder">
          <TimeInput id="reminder" aria-label="Send the reminder at" value={reminder} onChange={setReminder} />
        </Field>
      </Card>
    </Stack>
  )
}
