/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { NumberInput } from './NumberInput'
import { Card } from '../Card'
import { Field } from '../Field'
import { Stack } from '../Layout'

/* A NUMBER THE READER MEANS EXACTLY. The steppers are for nudging by one, and
 * the field is for typing 47 without pressing anything forty-seven times — both
 * matter, which is why this is not a bare <Input type="number">. When the exact
 * value does NOT matter and the feel does, it is a <Slider>; when it is a
 * measurement with a unit the reader knows, it is an <InputGroup> with a suffix.
 *
 * `min` and `max` CLAMP, they do not merely warn: the steppers stop and a typed
 * value is pulled back into range. So they are a promise about the data, not a
 * hint — set them from the same rule the server enforces, or the field will
 * accept what the save refuses.
 *
 * `surface` names what is behind the control. On a `--muted` ground the white
 * fill already separates it, so the resting border comes off; on a card the
 * surface is white too, and `base` keeps the border that does the separating.
 */
export function Example() {
  const [qty, setQty] = useState(1)
  const [seats, setSeats] = useState(12)

  return (
    <Stack gap={6}>
      <Field label="Quantity" htmlFor="qty">
        <NumberInput label="Quantity" surface="muted" value={qty} onChange={setQty} min={1} max={99} />
      </Field>

      <Card>
        <Field label="Seats" htmlFor="seats" hint="Between 1 and 500.">
          <NumberInput label="Seats" value={seats} onChange={setSeats} min={1} max={500} step={1} />
        </Field>
      </Card>
    </Stack>
  )
}
