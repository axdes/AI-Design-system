/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { DatePicker } from './DatePicker'
import { Field } from '../Field'

export function Example() {
  const [date, setDate] = useState<Date>()

  /* A field that opens a Calendar in a popover. Wrap in <Field> for a visible
   * label; `label` here names the trigger. Pass min/max to bound the range. */
  return (
    <Field label="Delivery date" htmlFor="delivery">
      <DatePicker label="Delivery date" value={date} onChange={setDate} />
    </Field>
  )
}
