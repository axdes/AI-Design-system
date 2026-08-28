/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState, type FormEvent } from 'react'
import { AuthTemplate } from './AuthTemplate'
import { Field } from '../../components/Field'
import { Input } from '../../components/Input'
import { PasswordInput } from '../../components/PasswordInput'

const signIn = () => new Promise((resolve) => setTimeout(resolve, 600))

export function Example() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  /* `busy` stops a second press. Copy this shape. */
  const [busy, setBusy] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!email || !password) return setError('Enter your email and password.')
    setError(null)
    setBusy(true)
    /* `finally`, not `then`: a rejected sign-in releases the button too. */
    void signIn().finally(() => setBusy(false))
  }

  return (
    <AuthTemplate
      brand={<strong>Acme</strong>}
      title="Sign in"
      subtitle="Sign in to continue"
      error={error}
      submitLabel="Sign in"
      busy={busy}
      busyLabel="Signing in"
      onSubmit={handleSubmit}
    >
      <Field label="Email" htmlFor="auth-email" required>
        <Input id="auth-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field label="Password" htmlFor="auth-password" required>
        <PasswordInput id="auth-password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
    </AuthTemplate>
  )
}
