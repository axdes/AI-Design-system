/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { PivotTable } from './PivotTable'

const TEAMS = [
  { key: 'atlas', label: 'Atlas' },
  { key: 'beacon', label: 'Beacon' },
  { key: 'cinder', label: 'Cinder' },
]
const MONTHS = [
  { key: 'jun', label: 'Jun' },
  { key: 'jul', label: 'Jul' },
  { key: 'aug', label: 'Aug' },
]
/* A gap in the data is a gap, not a zero: Cinder had not started in June. */
const HOURS: Record<string, Record<string, number>> = {
  atlas: { jun: 128, jul: 164, aug: 142 },
  beacon: { jun: 96, jul: 88, aug: 210 },
  cinder: { jul: 40, aug: 76 },
}

export function Example() {
  return (
    <PivotTable
      label="Hours by team and month"
      captionHidden
      rowHeader="Team"
      rows={TEAMS}
      columns={MONTHS}
      totals
      heat
      value={(team, month) => HOURS[team]?.[month]}
    />
  )
}
