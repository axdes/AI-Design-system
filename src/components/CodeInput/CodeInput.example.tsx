/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { CodeInput } from './CodeInput'

/* The parent owns the value, and knows when it is complete: the component does
 * not submit anything by itself. */
export function Example() {
  const [code, setCode] = useState('')
  return <CodeInput value={code} onChange={setCode} label="Verification code" />
}
