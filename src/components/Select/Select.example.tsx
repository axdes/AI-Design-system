/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { Select } from './Select'

type Leave = 'annual' | 'sick' | 'unpaid'

export function Example() {
  const [type, setType] = useState<Leave>('annual')
  return (
    <Select<Leave>
      label="Leave type"
      value={type}
      onChange={setType}
      options={[
        { value: 'annual', label: 'Annual leave' },
        { value: 'sick', label: 'Sick leave' },
        { value: 'unpaid', label: 'Unpaid leave' },
      ]}
    />
  )
}
