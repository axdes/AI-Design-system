/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Sparkline } from '../Sparkline'
import { Stat } from './Stat'

/* A KPI is four layers: the label, the value, the comparison and a visual
 * anchor. Direction and deltaTone are separate because up is good here and
 * would be bad on a latency tile. */
const week = [180, 176, 191, 188, 203, 214, 221]

export function Example() {
  return (
    <Stat
      value="221"
      label="Sessions this week"
      delta="+9% vs last week"
      deltaDirection="up"
      deltaTone="success"
      trend={<Sparkline values={week} tone="success" size="sm" area />}
    />
  )
}
