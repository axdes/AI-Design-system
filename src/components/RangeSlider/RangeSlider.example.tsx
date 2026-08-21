/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { RangeSlider } from './RangeSlider'

export function Example() {
  const [budget, setBudget] = useState<[number, number]>([25, 70])

  /* A bounded filter: the tuple is [start, end] and each thumb clamps against
   * the other. `showValue` prints the span at the end of the label row. */
  return (
    <RangeSlider
      label="Budget range"
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
