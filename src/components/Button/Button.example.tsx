/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Button } from './Button'
import { Icon } from '../Icon'

/* Add-type action: icon trails the label via `iconEnd`. */
export function Example() {
  return (
    <Button iconEnd>
      Create document
      <Icon name="add" />
    </Button>
  )
}
