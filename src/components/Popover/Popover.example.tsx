/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Popover } from './Popover'
import { Button } from '../Button'
import { Field } from '../Field'
import { Input } from '../Input'
import { Stack } from '../Layout'

export function Example() {
  /* For RICH content on click (a form, a set of controls, a detail card). Use
   * <Tooltip> for text hints and <Dropdown> for a menu of actions. Spread the
   * given trigger props onto whatever opens it. */
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
