/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Label } from './Label'

export function Example() {
  return <Label>Email address</Label>
}
