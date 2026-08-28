/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Popover } from './Popover'
import { Button } from '../Button'
import { Field } from '../Field'
import { Input } from '../Input'
import { Stack } from '../Layout'

export function Example() {
  /* THREE THINGS OPEN OVER A PAGE and choosing between them is the decision
   * here. A <Tooltip> names a control in a word and cannot be reached by touch.
   * A <Dropdown> is a menu: a list of actions, one of which gets chosen. A
   * Popover holds anything else — a form, a set of controls, a detail card — and
   * is the only one of the three the reader can work INSIDE.
   *
   * `label` is required because the panel is a dialog: without a name a screen
   * reader announces that something opened and nothing about what.
   *
   * `placement` is a preference decided by the room available, not the look, and
   * the layer flips itself when the chosen side does not fit. */
  return (
    <Popover
      label="Quick filter"
      trigger={(props) => <Button variant="secondary" {...props}>Filter</Button>}
    >
      <Stack gap={3}>
        <Field label="Minimum amount" htmlFor="min">
          <Input id="min" type="number" placeholder="0" />
        </Field>
        <Button variant="primary" block>Apply</Button>
      </Stack>
    </Popover>
  )
}
