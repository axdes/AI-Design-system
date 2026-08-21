/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Badge } from './Badge'

export function Example() {
  return <Badge tone="success">Published</Badge>
}
