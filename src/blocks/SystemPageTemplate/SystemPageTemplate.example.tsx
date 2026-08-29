/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Button } from '../../components/Button'
import { SystemPageTemplate } from './SystemPageTemplate'

/* THE COPY IS THE PATTERN. This is GOV.UK's problem page, and its order is the
 * order the reader's questions arrive in:
 *
 *   the FACT, as the title      — "there is a problem with the service", not
 *                                 "Error 500" and not an apology dressed as one
 *   what to DO next             — try again later, come back tomorrow
 *   what happened to their WORK — the question every failure page is asked and
 *                                 most do not answer, which is why people
 *                                 refill forms they did not need to
 *   who to CONTACT              — last, because it is the fallback
 *
 * Say what happened to their answers even when the answer is "they are gone".
 * A reader who is told loses a form; a reader who is not told loses trust in
 * every form on the site.
 *
 * `action` is ONE way out, and on a failure page it is `secondary` — a primary
 * button here promises the thing will work this time, which nobody can know.
 * Two ways out on a page the reader arrived at by accident is a decision they
 * have no basis to make.
 *
 * For a NOT-FOUND page the body becomes the three-way triage instead: if you
 * typed the address, check it; if you pasted it, check you copied all of it; if
 * you followed a link from here, it is our fault and here is how to say so.
 */
export function Example() {
  return (
    <SystemPageTemplate
      title="Sorry, there is a problem with the service"
      contact={<p>If it keeps happening, contact the service desk and name this page.</p>}
      action={<Button variant="secondary">Back to the start</Button>}
    >
      <p>Try again later.</p>
      <p>We saved your answers. They will be available for 30 days.</p>
    </SystemPageTemplate>
  )
}
