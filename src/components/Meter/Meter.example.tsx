/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Meter } from './Meter'

/* `label` names the gauge for assistive tech; `target` marks the goal line. */
export function Example() {
  return <Meter value={1.4} max={3} target={2} tone="warning" ticks={[0, 1, 2, 3]} label="Maturity 1.4 of 3" />
}
