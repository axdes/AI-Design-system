/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { Radio } from './Radio'
import { RadioGroup } from './RadioGroup'
import { Row, Stack } from '../Layout'
import { SectionLabel } from '../SectionLabel'

type Plan = 'monthly' | 'annual'

/* RADIO IS FOR A CHOICE THE READER CAN SEE ALL OF. Two to five options that fit
 * on the screen, where comparing them is part of deciding — a plan, a billing
 * period, a shipping speed. Past five, or when the reader already knows the
 * answer and only needs to type it, it is a <Select>. When more than one can be
 * true at once it is never a radio; it is <Checkbox>.
 *
 * `RadioGroup` is the default: it supplies the shared `name` that makes the set
 * exclusive, the arrow-key roving the platform expects, and the group label a
 * screen reader announces before the first option. Bare `<Radio>` is for the
 * case a group cannot own — one control per row of a list, where the rows are
 * rendered by something else and only the shared `name` joins them.
 *
 * `size` follows the density of what surrounds it, not the weight of the
 * choice: `md` in a form, `sm` in a table row or a filter panel where the
 * control sits inside a line of text.
 */
export function Example() {
  const [plan, setPlan] = useState<Plan>('monthly')
  const [primary, setPrimary] = useState('ada')

  return (
    <Stack gap={6}>
      {/* `label` is the group's ACCESSIBLE name, not a visible one: it becomes
          aria-label on the radiogroup. A group a reader can see needs the text
          on the screen as well, which is what SectionLabel is for. */}
      <Stack gap={2}>
        <SectionLabel>Billing period</SectionLabel>
        <RadioGroup<Plan>
          name="plan"
          label="Billing period"
          value={plan}
          onChange={setPlan}
          options={[
            { value: 'monthly', label: 'Monthly' },
            { value: 'annual', label: 'Annual' },
          ]}
        />
      </Stack>

      {/* One radio per row: the rows are the list, and `name` is all that makes
          them exclusive. A RadioGroup would have to own the rows to do this. */}
      <Stack gap={2}>
        <SectionLabel>Primary contact</SectionLabel>
        {[
          { id: 'ada', name: 'Ada Meridian' },
          { id: 'ben', name: 'Ben Torres' },
        ].map((person) => (
          <Row key={person.id} gap={3} align="center">
            <Radio
              name="primary-contact"
              size="sm"
              value={person.id}
              checked={primary === person.id}
              onChange={() => setPrimary(person.id)}
              label={person.name}
            />
          </Row>
        ))}
      </Stack>
    </Stack>
  )
}
