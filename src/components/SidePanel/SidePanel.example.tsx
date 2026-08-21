/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { SidePanel } from './SidePanel'
import { Button } from '../Button'
import { Field } from '../Field'
import { Input } from '../Input'

/* Header (title + close) / scrolling body / pinned footer. Outer width and
 * border come from a className on the consumer side. */
export function Example() {
  return (
    <SidePanel
      title="Request leave"
      onClose={() => undefined}
      footer={
        <>
          <Button>Submit</Button>
          <Button variant="secondary">Cancel</Button>
        </>
      }
    >
      <Field label="Dates" htmlFor="dates">
        <Input id="dates" placeholder="DD.MM.YYYY - DD.MM.YYYY" />
      </Field>
    </SidePanel>
  )
}
