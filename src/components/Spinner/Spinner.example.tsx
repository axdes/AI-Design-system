/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Spinner } from './Spinner'
import { Row } from '../Layout'

/* THE SIZE FOLLOWS WHAT IS WAITING, and that decides where a spinner belongs at
 * all. `sm` sits inside a control that is working — but a <Button loading> puts
 * one there itself, so reaching for this one usually means the button was
 * hand-rolled. `md` is for a panel or a card fetching its own contents. `lg` and
 * `xl` are for a whole screen with nothing on it yet, and a screen that waits
 * more than a moment wants a <Skeleton> instead: a spinner says "wait", a
 * skeleton says what is coming.
 *
 * `label` is not decoration and not a caption — it is what a screen reader
 * announces while the wait lasts. "Loading" is the default and is nearly always
 * too vague: say what is loading.
 */
export function Example() {
  return (
    <Row gap={6} align="center">
      <Spinner label="Saving the draft" />
      <Spinner size="md" label="Loading invoices" />
      <Spinner size="lg" label="Preparing the report" />
    </Row>
  )
}
