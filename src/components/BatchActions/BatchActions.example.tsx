/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { BatchActions } from './BatchActions'
import { Button } from '../Button'

export function Example() {
  /* The bar exists only while something is selected, so the example opens in
     the state it exists for: three rows picked, waiting for a verb. */
  const [count, setCount] = useState(3)
  if (count === 0) return <Button size="sm" onClick={() => setCount(3)}>Select three rows</Button>

  return (
    <BatchActions count={count} onClear={() => setCount(0)}>
      <Button variant="secondary" size="sm">Export</Button>
      <Button variant="secondary" size="sm">Assign owner</Button>
    </BatchActions>
  )
}
