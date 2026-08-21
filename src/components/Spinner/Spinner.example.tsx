/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Spinner } from './Spinner'

export function Example() {
  /* `label` is the accessible name a screen reader announces — a spinner
   * without one is a silent "something is happening". Inline by default; the
   * layout around it does the centering. */
  return <Spinner label="Loading your workspace" />
}
