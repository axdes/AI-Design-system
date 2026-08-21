/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Input } from './Input'

/* On its own screen pair the input with a <Field> or <Label>; the aria-label
 * here just keeps this standalone example accessible. */
export function Example() {
  return <Input aria-label="Search" placeholder="Search documents" />
}
