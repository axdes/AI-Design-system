/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { DateRangePicker, type DateRange } from './DateRangePicker'

export function Example() {
  const [stay, setStay] = useState<DateRange | undefined>()

  /* Two picks in one calendar: the first click marks the start, the second
   * closes with the ordered range. onChange only fires with both ends set. */
  return (
    <DateRangePicker
      label="Stay dates"
      value={stay}
      onChange={setStay}
      placeholder="Select dates"
    />
  )
}
