/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { Chip } from './Chip'
import { Row } from '../Layout'

const FILTERS = ['Draft', 'In review', 'Published']

/* A CHIP IS A CONTROL; a Tag is a label. If pressing the pill does nothing, it
 * is a <Tag> and this is the wrong part. That is the choice this example is
 * about, and it is the one that gets made wrong.
 *
 * `selected` is what makes a row of chips a FILTER, and each one toggles on its
 * own — any number can be on at once. When exactly one may be chosen the reader
 * needs a <SegmentedControl>, which says so by its shape; a row of chips where
 * only one can be on looks broken every time a second is pressed.
 *
 * `variant` is weight against the surface, the same scale a Button uses, and
 * `secondary` is right for nearly every filter row: chips are a control BAR, not
 * the action the screen exists for.
 */
export function Example() {
  const [on, setOn] = useState<string[]>(['In review'])
  const toggle = (f: string) => setOn((s) => (s.includes(f) ? s.filter((x) => x !== f) : [...s, f]))
  return (
    <Row gap={2} align="center">
      {FILTERS.map((f) => (
        <Chip key={f} selected={on.includes(f)} onClick={() => toggle(f)}>{f}</Chip>
      ))}
      <Chip variant="ghost" icon="add" onClick={() => undefined}>Add filter</Chip>
    </Row>
  )
}
