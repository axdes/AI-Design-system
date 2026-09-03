/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Button } from './Button'
import { Icon } from '../Icon'
import { Row } from '../Layout'

/* THE CHOICE IS THE VARIANT, and it is a choice about the SCREEN, not the button:
 * exactly one action on a screen is `primary` — the thing the reader came to do.
 * Everything else beside it is `secondary`. `ghost` is for a control that must not
 * compete with the content it sits on, and `destructive` is reserved for the action
 * that cannot be undone, where the colour IS the warning.
 *
 * Two of these have no variant at all, on purpose: a button that leaves it off is
 * secondary, which is the right default for a control you have not thought about.
 *
 * The icon always trails the label — one line of CSS, not a prop.
 */
export function Example() {
  return (
    <Row gap={2} align="center">
      <Button variant="primary">
        Create document
        <Icon name="add" />
      </Button>
      <Button>Save draft</Button>
      <Button variant="ghost">Cancel</Button>
      <Button variant="destructive" loading loadingLabel="Deleting">Delete</Button>
    </Row>
  )
}
