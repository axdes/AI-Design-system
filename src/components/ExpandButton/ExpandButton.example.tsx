/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { ExpandButton } from './ExpandButton'

/* `label` is the accessible name; `withChevron` adds the disclosure caret. */
export function Example() {
  return <ExpandButton icon="add" label="Create" withChevron />
}
