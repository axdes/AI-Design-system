/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { SectionLabel } from './SectionLabel'

export function Example() {
  return <SectionLabel>Leave details</SectionLabel>
}
