/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { Field } from './Field'
import { Input } from '../Input'

export function Example() {
  const [email, setEmail] = useState('not-an-address')
  const invalid = !email.includes('@')

  /* `htmlFor` ties the label to the control's id; `error` is wired to the same
   * control with aria-describedby, so the reason is read as part of the field
   * rather than as a stray sentence underneath it. */
  return (
    <Field
      label="Email address"
      htmlFor="email"
      required
      hint="We only use it to send the invitation."
      error={invalid ? 'Enter an address with an @ in it.' : undefined}
    >
      <Input
        id="email"
        type="email"
        autoComplete="email"
        value={email}
        invalid={invalid}
        onChange={(e) => setEmail(e.target.value)}
      />
    </Field>
  )
}
