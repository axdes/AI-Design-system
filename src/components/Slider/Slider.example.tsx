/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { Slider } from './Slider'

export function Example() {
  const [budget, setBudget] = useState(40)

  /* Controlled single value. `showValue` + `formatValue` put a live read-out at
   * the end of the label row. The native range keeps full keyboard support. */
  return (
    <Slider
      label="Monthly budget"
      value={budget}
      onChange={setBudget}
      min={0}
      max={100}
      step={5}
      showValue
      formatValue={(v) => `SAR ${v}k`}
    />
  )
}
