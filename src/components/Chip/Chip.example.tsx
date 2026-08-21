/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Chip } from './Chip'

export function Example() {
  return <Chip icon="calendar" onClick={() => undefined}>Request leave</Chip>
}
