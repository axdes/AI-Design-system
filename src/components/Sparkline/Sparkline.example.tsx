/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Sparkline } from './Sparkline'

/* Seven days of a number the reader already sees beside the chart, which is
 * why this one takes no label: the value says what it is, the line says which
 * way it went. */
const week = [42, 45, 41, 52, 49, 58, 63]

export function Example() {
  return <Sparkline values={week} tone="success" area />
}
