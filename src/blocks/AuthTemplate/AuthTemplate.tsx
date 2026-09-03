import './AuthTemplate.css'
import { type ReactNode } from 'react'
import { Alert } from '../../components/Alert'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { Stack } from '../../components/Layout'
import { cn } from '../../lib/cn'

/* Monolithic because a sign-in screen is one composition: the brand, the
 * words, the form, the error above it and the busy state that freezes the
 * way out. Split into parts, a product can ship the brand without the form
 * or the submit without the error, which is exactly what the hand-written
 * sign-in screens did. */
type Props = {
  /** Brand mark shown above the content (a logo img or wordmark node). */
  brand: ReactNode
  /**
   * The page's accessible name, rendered as a visually hidden `<h1>`. A logo
   * image is not a heading: without this the screen has no h1 at all and a
   * screen reader lands on a page with no title.
   */
  /* ReactNode, like every other title in this system: a heading routinely
   * carries a status beside the words or a product name in the brand colour,
   * and typing it as a string is what sends a screen off to hand-roll its own
   * header. Widened 2026-09-03; nothing here puts it in an attribute — the
   * dialog labels itself by id, not by the text. */
  title: ReactNode
  /** Optional one-line subtitle under the brand. */
  subtitle?: ReactNode
  /** The form fields, or whatever the screen shows when there is no form. */
  children: ReactNode
  /** Error message shown above the submit; null/undefined when clear. */
  error?: string | null
  /** Optional footer under the content (links, hints, demo accounts). */
  footer?: ReactNode
  /**
   * Extra class on the page wrapper: where a product puts its own background.
   * The template owns the structure, the product owns the brand.
   */
  className?: string
  /**
   * Pins the screen to one theme regardless of the app's. Auth screens are
   * usually branded and lit, and the dark card you would otherwise get looks
   * broken against a light brand background.
   */
  themeLock?: 'light' | 'dark'
  /**
   * Present together or not at all. With them the content is wrapped in a
   * `<form>` under a full-width submit; without them it is rendered as-is.
   *
   * Not every auth screen is a form, which is why nothing could adopt this block
   * while these were mandatory: one product signs in through SSO buttons and a
   * number to confirm in Authenticator, another swaps its form for a progress
   * readout while it pulls data for minutes. Both are still the same centred
   * card on the same branded page, so the form is a mode, not the shape.
   *
   * (A discriminated union would enforce the pairing, but the registry generator
   * reads a single object type and silently published two props out of ten when
   * this was a union. The registry is the contract agents build against, so its
   * accuracy wins over a compile-time nicety no caller needed.)
   */
  /* No argument. The vocabulary says onSubmit carries what was collected and
   * never a DOM event, and handing the caller a FormEvent made every sign-in
   * screen write the same `e.preventDefault()` — the template does it here, once.
   * (2026-09-03) */
  onSubmit?: () => void
  /** The submit button label. Only meaningful together with `onSubmit`. */
  submitLabel?: ReactNode
  /** The submission is in flight: the submit shows a spinner and stops accepting
   *  presses, so it cannot be fired twice. */
  busy?: boolean
  /** What the spinner announces while `busy` (default "Loading"). */
  busyLabel?: string
}

/* Sizing is knobbed with CSS custom properties on the wrapper, so a product
 * adjusts it in its own stylesheet instead of forking the block:
 * `--auth-card-width` and `--auth-card-padding`. */

/** Centered auth-page skeleton: one Card with a brand slot, the caller's content,
 *  an error slot, and a full-width submit when there is a form. Structure only. 
 *
 * Copy: the title is what the reader is here to do — "Sign in", not the
 * product's name over again. The error says what to try, and never whether
 * it was the address or the password that was wrong.
 */
export function AuthTemplate({
  brand,
  title,
  subtitle,
  children,
  submitLabel,
  error,
  footer,
  onSubmit,
  busy,
  busyLabel,
  className,
  themeLock,
}: Props) {
  /* `role="alert"`, not the default `status`: a failed sign-in must be announced
   * immediately, and it belongs next to the control the user just pressed rather
   * than above content they are not looking at. Both were wrong while nothing
   * used this block. */
  const alert = error && (
    <Alert tone="danger" role="alert">
      {error}
    </Alert>
  )

  return (
    /* A <main>, not a <div>: a sign-in screen is a page like any other, and
       without a landmark everything on it sits outside one — axe reports both
       "no main" and "content not in a landmark", and a screen reader has nothing
       to skip to. This screen has no shell to provide it, so the block does. */
    <main className={cn('auth-template', className)} data-theme-lock={themeLock}>
      <Card className="auth-template-card">
        <Stack gap={6}>
          <Stack gap={2}>
            <h1 className="visually-hidden">{title}</h1>
            {brand}
            {subtitle && <p className="auth-template-subtitle">{subtitle}</p>}
          </Stack>
          {onSubmit ? (
            <form onSubmit={(e) => { e.preventDefault(); onSubmit() }}>
              <Stack gap={4}>
                {children}
                {alert}
                {/* `busy` reaches the DOM as a disabled submit, and that is the
                    whole guard: it stops the second click AND the second Enter,
                    with the browser enforcing it rather than a flag the caller
                    has to remember to test inside its own handler.

                    Sign-in is the request people double-press — slow, no feedback
                    of its own, and the second press is what creates the duplicate
                    session or trips the rate limit. Nothing in this system said
                    how to prevent it, so every product had to invent it, which
                    means every product could forget it. The block that owns the
                    submit owns the guard. */}
                <Button type="submit" block loading={busy} loadingLabel={busyLabel}>
                  {submitLabel}
                </Button>
              </Stack>
            </form>
          ) : (
            <Stack gap={4}>
              {children}
              {alert}
            </Stack>
          )}
          {footer}
        </Stack>
      </Card>
    </main>
  )
}
