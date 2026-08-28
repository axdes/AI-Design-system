/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { Field } from '../Field'
import { PasswordInput } from './PasswordInput'

/* Same shape as any other field: <Field> owns the label and the hint, the
 * control owns the reveal.
 *
 * `new-password`, not `current-password`: the second one tells the browser this
 * is a sign-in, and a browser handed a sign-in fills the nearest username-ish
 * box on the page from its saved credentials — on the components page that was
 * the site's own search field, which filled itself with a person's name the
 * moment this example was opened (owner, 2026-08-24). A form asking for a NEW
 * password is the honest declaration for a field with no account behind it. */
export function Example() {
  const [password, setPassword] = useState('')
  return (
    <Field label="Password" htmlFor="signin-password" hint="At least 12 characters">
      <PasswordInput
        id="signin-password"
        value={password}
        autoComplete="new-password"
        onChange={(e) => { setPassword(e.target.value) }}
      />
    </Field>
  )
}
