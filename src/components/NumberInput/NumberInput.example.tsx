/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { NumberInput } from './NumberInput'
import { Field } from '../Field'

export function Example() {
  const [qty, setQty] = useState(1)

  /* Clamps to min/max; the -/+ buttons and the native spinbutton stay in sync.
   * Wrap in a <Field> for the visible label. */
  return (
    <Field label="Quantity" htmlFor="qty">
      <NumberInput label="Quantity" value={qty} onChange={setQty} min={1} max={99} />
    </Field>
  )
}
