/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Icon } from './Icon'

/* `name` is a Material-Icons-style string mapped to Lucide in Icon.tsx. */
export function Example() {
  return <Icon name="calendar" />
}
