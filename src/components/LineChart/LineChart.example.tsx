/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { LineChart } from './LineChart'

/* One entry per line, each with a value per label, oldest first. The slot
 * colours are assigned in this order and never cycled, so adding a third line
 * never repaints the first two. */
const MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug']

export function Example() {
  return (
    <LineChart
      labels={MONTHS}
      series={[
        { label: 'Raised', values: [52, 61, 48, 67, 72] },
        { label: 'Closed', values: [34, 41, 28, 47, 52] },
      ]}
      target={60}
      label="Findings raised and closed per month"
    />
  )
}
