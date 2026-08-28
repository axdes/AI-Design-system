/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { Select } from './Select'
import { Row } from '../Layout'

type Leave = 'annual' | 'sick' | 'unpaid'
const LEAVE = [
  { value: 'annual' as const, label: 'Annual leave' },
  { value: 'sick' as const, label: 'Sick leave' },
  { value: 'unpaid' as const, label: 'Unpaid leave' },
]

/* WHEN TO REACH FOR THIS ONE AT ALL: a Select is for a closed set the reader
 * already knows, of about three to a dozen values. Fewer than four and the
 * choices should be on screen — that is a <SegmentedControl> or a radio group.
 * More than a dozen, or a set the reader has to search, and it is a <Combobox>.
 * Above a list, filtering rather than choosing, it is a <FilterDropdown>.
 *
 * `surface` is the one prop that is about where it stands rather than what it
 * does: `muted` for a control on a card or a toolbar, whose own fill would
 * otherwise disappear into the surface behind it.
 *
 * `label` is required and it is not decoration — a select with no name announces
 * only its current value, so a screen reader user hears "Annual leave" and has
 * no idea what it is the answer to.
 */
export function Example() {
  const [type, setType] = useState<Leave>('annual')
  const [second, setSecond] = useState<Leave>('sick')
  return (
    <Row gap={3} align="end">
      <Select<Leave> label="Leave type" value={type} onChange={setType} options={LEAVE} />
      <Select<Leave> label="On a card" surface="muted" size="sm" value={second} onChange={setSecond} options={LEAVE} />
    </Row>
  )
}
