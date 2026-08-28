/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { TagGroup } from './TagGroup'

/* Two labels and the count: the rest are named in the tooltip, so the row keeps
   one height and nothing is hidden without saying so. */
export function Example() {
  return <TagGroup items={['Finance', 'Q3', 'Reviewed', 'Frankfurt']} />
}
