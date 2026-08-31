/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { Chip } from './Chip'
import { Row, Stack } from '../Layout'

const FILTERS = ['Draft', 'In review', 'Published']

/* IS THE PILL A CONTROL OR IS IT DATA? That is the one choice here, and it is
 * the one that gets made wrong. Pressing a control does something, so it is a
 * <button> and it is announced as pressed when `selected`. Data is a value the
 * reader typed or chose; it must never look pressable, so it renders a <span>
 * and answers nothing. Passing `onRemove` says data on its own — the X is then
 * the only target, and a button inside a button is invalid HTML anyway.
 *
 * `selected` is what makes a row of chips a FILTER, and each one toggles on its
 * own — any number can be on at once. When exactly one may be chosen the reader
 * needs a <SegmentedControl>, which says so by its shape; a row of chips where
 * only one can be on looks broken every time a second is pressed.
 *
 * `variant` is weight against the surface, the same scale a Button uses, and
 * `secondary` is right for nearly every filter row: chips are a control BAR, not
 * the action the screen exists for. A data token has no variant to choose: a
 * colour on a value means a state the value does not have.
 *
 * `removeLabel` is required with `onRemove` and has to name WHAT is being
 * removed. A row of buttons all announced as "Remove" tells a screen-reader
 * user nothing about which one they are on.
 *
 * `size` follows what the pill sits in, not how important it is: `sm` in a
 * table cell or a dense row, `md` beside body text.
 */
export function Example() {
  const [on, setOn] = useState<string[]>(['In review'])
  const [recipients, setRecipients] = useState(['Sarah', 'Ahmed'])
  const toggle = (f: string) => setOn((s) => (s.includes(f) ? s.filter((x) => x !== f) : [...s, f]))

  return (
    <Stack gap={4}>
      {/* Controls: pressing one filters the list behind them. */}
      <Row gap={2} align="center">
        {FILTERS.map((f) => (
          <Chip key={f} selected={on.includes(f)} onClick={() => toggle(f)}>{f}</Chip>
        ))}
        <Chip variant="ghost" icon="add" onClick={() => undefined}>Add filter</Chip>
      </Row>

      {/* Data: the values themselves. The pill does nothing; the X removes. */}
      <Row gap={2}>
        {recipients.map((name) => (
          <Chip
            key={name}
            onRemove={() => setRecipients((r) => r.filter((x) => x !== name))}
            removeLabel={`Remove ${name}`}
          >
            {name}
          </Chip>
        ))}
        {/* The same token with nothing to remove: a plain label, at the smaller
            scale a table cell wants. */}
        <Chip interactive={false}>Internal</Chip>
      </Row>
    </Stack>
  )
}
