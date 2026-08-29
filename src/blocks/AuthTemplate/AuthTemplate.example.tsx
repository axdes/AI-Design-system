/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState, type FormEvent } from 'react'
import { AuthTemplate } from './AuthTemplate'
import { Field } from '../../components/Field'
import { Input } from '../../components/Input'
import { PasswordInput } from '../../components/PasswordInput'

const signIn = () => new Promise((resolve) => setTimeout(resolve, 600))

/* A SIGN-IN IS THE ONE SCREEN WITH NO WAY OUT, and that is what the template
 * encodes: brand, one question, one commitment, and nothing to navigate to.
 * Put a second task on it and the reader who cannot get in has two things that
 * are not working.
 *
 * `busy` STOPS A SECOND PRESS, and it is released in `finally`, never in
 * `then` — a rejected sign-in has to give the button back, or a wrong password
 * locks the reader out of their own form.
 *
 * `themeLock` PINS THE SCREEN TO ONE THEME regardless of the app's, and it is
 * about the BRAND BEHIND THE CARD rather than a preference. An auth screen is
 * usually a lit brand background, and the dark card a reader's system theme
 * would otherwise hand them looks broken on it. Lock it to whichever theme the
 * brand art is drawn for; leave it off only when the screen is plain enough to
 * survive both.
 *
 * `error` is the message for the WHOLE attempt, above the fields — a field's
 * own problem belongs to its <Field>, and putting "wrong password" up here
 * makes the reader hunt for which box it is about.
 */
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
      themeLock="light"
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

/* The same screen on a dark brand: the lock follows the art behind the card,
 * not the reader's system setting. Everything else is identical. */
export function DarkBrandExample() {
  return (
    <AuthTemplate
      brand={<strong>Acme</strong>}
      themeLock="dark"
      title="Sign in"
      subtitle="Sign in to continue"
      submitLabel="Sign in"
      onSubmit={(e) => { e.preventDefault() }}
    >
      <Field label="Email" htmlFor="auth-email-dark" required>
        <Input id="auth-email-dark" type="email" autoComplete="email" defaultValue="" />
      </Field>
      <Field label="Password" htmlFor="auth-password-dark" required>
        <PasswordInput id="auth-password-dark" autoComplete="current-password" defaultValue="" />
      </Field>
    </AuthTemplate>
  )
}
