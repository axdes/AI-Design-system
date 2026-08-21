/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { Field } from '../Field'
import { PasswordInput } from './PasswordInput'

/* Same shape as any other field: <Field> owns the label and the hint, the
 * control owns the reveal. */
export function Example() {
  const [password, setPassword] = useState('')
  return (
    <Field label="Password" htmlFor="signin-password" hint="At least 12 characters">
      <PasswordInput
        id="signin-password"
        value={password}
        autoComplete="current-password"
        onChange={(e) => { setPassword(e.target.value) }}
      />
    </Field>
  )
}
