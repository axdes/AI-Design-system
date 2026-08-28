/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Identity } from '../Identity'
import { Quote } from './Quote'

/* Attribution is the evidence, which is why `by` is required: the same sentence
 * without a name is copy we wrote about ourselves. */
export function Example() {
  return (
    <Quote
      by={<Identity avatarName="Dev Okonkwo" name="Dev Okonkwo" secondary="Head of Safety" size="sm" />}
      source="Site 14"
    >
      The audit that used to take a week now takes an afternoon, and the findings
      arrive in the words the crew actually uses.
    </Quote>
  )
}
