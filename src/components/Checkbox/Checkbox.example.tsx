/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { Checkbox } from './Checkbox'

export function Example() {
  const [checked, setChecked] = useState(false)

  return (
    <Checkbox
      label="Email me when a review is assigned"
      checked={checked}
      onChange={(e) => setChecked(e.target.checked)}
    />
  )
}
