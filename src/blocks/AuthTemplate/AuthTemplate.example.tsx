/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { AuthTemplate } from './AuthTemplate'
import { BrandMark } from '../../components/BrandMark'
import { Logo } from '../../shell/Logo'
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
 *
 * THE AUTOCOMPLETE HERE IS THE EXAMPLE'S, NOT A PRODUCT'S. A real sign-in says
 * `email` and `current-password`, and it should: that is how a password manager
 * offers the right credential. This is a gallery, and a browser handed those
 * two on a page with no account behind it does exactly what it is designed to
 * do — the owner opened this screen and found their own address already typed
 * into it (2026-08-30). The same trap <PasswordInput> records from 2026-08-24,
 * one screen along. Copy the shape, not these two values.
 */
export function Example() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  /* `busy` stops a second press. Copy this shape. */
  const [busy, setBusy] = useState(false)

  /* No event to stop: the template owns the form and calls this after it has
   * done that itself. */
  const handleSubmit = () => {
    if (!email || !password) return setError('Enter your email and password.')
    setError(null)
    setBusy(true)
    /* `finally`, not `then`: a rejected sign-in releases the button too. */
    void signIn().finally(() => setBusy(false))
  }

  return (
    <AuthTemplate
      /* THE BRAND SLOT TAKES A MARK, NOT A WORD. A sign-in is the one screen a
         reader arrives at before they are sure they are in the right place, and
         a product name set in the body face answers that less than the mark
         does. `title` is the heading a screen reader lands on, which is why the
         mark is free to be a picture (owner, 2026-08-30). */
      brand={<BrandMark><Logo size={28} tone="inverse" /></BrandMark>}
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
        <Input id="auth-email" type="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field label="Password" htmlFor="auth-password" required>
        <PasswordInput id="auth-password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
    </AuthTemplate>
  )
}

/* The same screen on a dark brand: the lock follows the art behind the card,
 * not the reader's system setting. Everything else is identical. */
export function DarkBrandExample() {
  return (
    <AuthTemplate
      brand={<BrandMark><Logo size={28} tone="inverse" /></BrandMark>}
      themeLock="dark"
      title="Sign in"
      subtitle="Sign in to continue"
      submitLabel="Sign in"
      onSubmit={() => {}}
    >
      <Field label="Email" htmlFor="auth-email-dark" required>
        <Input id="auth-email-dark" type="email" autoComplete="off" defaultValue="" />
      </Field>
      <Field label="Password" htmlFor="auth-password-dark" required>
        <PasswordInput id="auth-password-dark" autoComplete="new-password" defaultValue="" />
      </Field>
    </AuthTemplate>
  )
}
