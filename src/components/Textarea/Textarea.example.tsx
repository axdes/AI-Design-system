/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Textarea } from './Textarea'

export function Example() {
  return <Textarea aria-label="Remarks" rows={4} placeholder="Add any remarks" />
}
