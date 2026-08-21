/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { MetaItem } from './MetaItem'

export function Example() {
  return <MetaItem icon="text_fields">1,240 words</MetaItem>
}
