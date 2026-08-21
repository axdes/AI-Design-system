/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Stat } from './Stat'

export function Example() {
  return <Stat value="2.0" label="Avg maturity" />
}
