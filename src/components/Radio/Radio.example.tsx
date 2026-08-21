/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { RadioGroup } from './RadioGroup'

type Plan = 'monthly' | 'annual'

/* RadioGroup wires the shared name + single selection; reach for a bare <Radio>
 * only when you need a standalone control. */
export function Example() {
  const [plan, setPlan] = useState<Plan>('monthly')
  return (
    <RadioGroup<Plan>
      name="plan"
      label="Billing period"
      value={plan}
      onChange={setPlan}
      options={[
        { value: 'monthly', label: 'Monthly' },
        { value: 'annual', label: 'Annual' },
      ]}
    />
  )
}
