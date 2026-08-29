/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Identity } from '../Identity'
import { Stack } from '../Layout'
import { Quote } from './Quote'

/* ATTRIBUTION IS THE EVIDENCE, which is why `by` is required. The same sentence
 * with no name on it is copy we wrote about ourselves, and a reader knows the
 * difference. `source` is where it was said — the site, the team, the article —
 * and it is what makes the name checkable rather than decorative.
 *
 * `size` is how much of the page the quote is ASKING FOR. `md` is a quote
 * inside something else: a case study, a card, a section that carries on around
 * it. `lg` is the pull quote a section is built around, and a page gets one —
 * two large quotes on one screen are two things shouting, and the reader
 * believes neither.
 */
export function Example() {
  return (
    <Stack gap={8}>
      <Quote
        size="lg"
        by={<Identity avatarName="Dev Okonkwo" name="Dev Okonkwo" secondary="Head of Safety" size="sm" />}
        source="Site 14"
      >
        The audit that used to take a week now takes an afternoon, and the findings
        arrive in the words the crew actually uses.
      </Quote>

      {/* Inside a longer piece, where the text carries on around it. */}
      <Quote
        by={<Identity avatarName="Ada Meridian" name="Ada Meridian" secondary="Product designer" size="sm" />}
        source="Onboarding review"
      >
        We stopped writing the checklist twice.
      </Quote>
    </Stack>
  )
}
