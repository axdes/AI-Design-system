/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Textarea } from './Textarea'
import { Field } from '../Field'
import { CharacterCount } from '../CharacterCount'
import { Stack } from '../Layout'

/* ROWS IS A PROMISE ABOUT LENGTH. It is the only thing telling the reader how
 * much is expected before they start typing, and getting it wrong is the whole
 * mistake this component invites: four rows for a one-line note reads as a
 * demand for an essay, two rows for a description reads as a field that will
 * fight them.
 *
 * `size` is the control's own scale and follows what it sits beside, not how
 * much text is wanted — that is `rows`. A textarea in a dense panel takes `sm`
 * for the same reason the inputs around it do.
 *
 * A limit belongs UNDER the control as a running total, never as an instruction
 * above it: the reader needs it while they type, not before. `<Field counter>` is
 * the one place that goes.
 */
export function Example() {
  return (
    <Stack gap={4}>
      <Field label="Why is this on hold?" htmlFor="why" hint="One or two sentences the next reviewer can act on.">
        <Textarea id="why" rows={3} placeholder="Waiting on the client to confirm the scope" />
      </Field>
      <Field label="Internal note" htmlFor="note" counter={<CharacterCount value="" max={280} />}>
        <Textarea id="note" rows={2} size="sm" surface="muted" />
      </Field>
    </Stack>
  )
}
