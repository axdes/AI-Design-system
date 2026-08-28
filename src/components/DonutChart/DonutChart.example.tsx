/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { DonutChart } from './DonutChart'

/* Shares of one whole, toned by what they MEAN: the ring answers "how much of
 * it is bad?", which is why the segments carry status tones rather than a
 * palette of unrelated hues. */
const FINDINGS = [
  { label: 'Closed', value: 214, tone: 'success' as const },
  { label: 'Open', value: 78, tone: 'warning' as const },
  { label: 'Overdue', value: 28, tone: 'danger' as const },
]

export function Example() {
  return <DonutChart segments={FINDINGS} center="320" caption="findings" label="Findings by state" />
}
