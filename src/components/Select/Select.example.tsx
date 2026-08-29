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
 * `surface` NAMES WHAT IS BEHIND THE CONTROL, not the control: `muted` for a
 * `--muted` ground — a toolbar, a tinted strip, the page's own muted background
 * — where the control's white fill already separates it, so the resting border
 * comes off. A card is white, so there the fill separates nothing and `base`
 * keeps the border that does.
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
      <Select<Leave> label="In a toolbar" surface="muted" size="sm" value={second} onChange={setSecond} options={LEAVE} />
    </Row>
  )
}
