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
/* A GAP IN THE DATA IS A GAP, NOT A ZERO: Cinder had not started in June, and
 * writing 0 there would say they did nothing, which is a different claim. */
const HOURS: Record<string, Record<string, number>> = {
  atlas: { jun: 128, jul: 164, aug: 142 },
  beacon: { jun: 96, jul: 88, aug: 210 },
  cinder: { jul: 40, aug: 76 },
}

/* ONE MEASURE ACROSS TWO DIMENSIONS. Every cell in this grid is the same kind
 * of number, which is what makes the rows and columns comparable and the
 * colouring meaningful. A table whose columns hold DIFFERENT things — a name, a
 * status, a date — is a <Table>; putting it here promises a comparison that
 * cannot be made.
 *
 * `value` returns `undefined` for a cell with no data, and the component draws
 * that as empty rather than as zero. Coalescing to 0 in the accessor is the one
 * mistake that quietly ruins a pivot: the totals change, the heat map paints a
 * cold square, and the reader is told a team did nothing when nobody asked them
 * to do anything.
 *
 * `heat` is worth it only when the reader is HUNTING — looking for the outlier
 * in a grid too big to read. On a small grid it colours nine cells the reader
 * was going to read anyway, and colour that carries no news trains people to
 * ignore colour that does.
 *
 * `totals` adds the margins. Leave them off when the measure does not add up:
 * averages, rates and percentages summed along an edge are a number with no
 * meaning at all.
 */
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
