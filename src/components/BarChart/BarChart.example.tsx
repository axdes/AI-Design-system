/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { BarChart } from './BarChart'

/* One number per period, oldest first. `target` draws the goal across them, so
 * a column can be read as short OF something rather than just short. */
const CLOSED = [
  { label: 'Apr', value: 34 },
  { label: 'May', value: 41 },
  { label: 'Jun', value: 28 },
  { label: 'Jul', value: 47 },
  { label: 'Aug', value: 52 },
]

export function Example() {
  return (
    <BarChart
      data={CLOSED}
      target={40}
      emphasis="Aug"
      /* `label` is what the chart measures. It names the chart for a screen
         reader, which then reads the table the component renders for it. */
      label="Findings closed per month"
    />
  )
}
