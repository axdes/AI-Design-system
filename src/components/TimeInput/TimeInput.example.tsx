/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { TimeInput } from './TimeInput'

/* On its own screen pair the field with a <Field> or <Label>; the aria-label
 * here just keeps this standalone example accessible. */
export function Example() {
  const [start, setStart] = useState('09:30')
  return <TimeInput aria-label="Starts at" value={start} onChange={setStart} />
}
