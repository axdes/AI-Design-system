/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { Stack } from '../Layout'
import { SectionLabel } from '../SectionLabel'
import { Checkbox } from './Checkbox'
import { CheckboxGroup } from './CheckboxGroup'

const CHANNELS = [
  { value: 'email', label: 'Email' },
  { value: 'teams', label: 'Teams message' },
]

/* One box answers a yes/no question of its own; several boxes answering the
 * SAME question are a CheckboxGroup, which carries the group name a screen
 * reader announces before the first box. */
export function Example() {
  const [assigned, setAssigned] = useState(false)
  const [channels, setChannels] = useState(['email'])

  /* ONE BOX IS A YES/NO; a group is "any number of these". They are different
   * questions and the reader can tell them apart by shape, which is why a lone
   * <Checkbox> repeated three times is the wrong answer to the second — it loses
   * the group's name, and a screen reader then reads three unrelated questions.
   *
   * `indeterminate` is not a third value the reader can choose. It is what a
   * PARENT box shows when some of its children are on, and it exists so a
   * select-all never lies about the state below it.
   *
   * `label` is required on both: a checkbox whose words sit beside it as loose
   * text is a checkbox with no name, and the hit area stops at the box.
   *
   * One thing the group does NOT do: show its own label. `CheckboxGroup label`
   * is announced and not painted, so the question a sighted reader needs comes
   * from the `<Field>` around it. A group dropped into a form on its own reads
   * as a list of unrelated boxes.
   */
  return (
    <Stack gap={4}>
      <Checkbox
        label="Email me when a review is assigned"
        checked={assigned}
        onChange={(e) => setAssigned(e.target.checked)}
      />
      <CheckboxGroup
        label="How should we reach you?"
        options={CHANNELS}
        value={channels}
        onChange={setChannels}
      />
      {/* The parent of a partly-chosen set: neither on nor off, and it says so
          rather than picking one. */}
      <Checkbox label="All channels" indeterminate checked={false} onChange={() => undefined} />
      {/* `size` follows the density of what is AROUND it, not the importance of
          the question: `sm` in a table row or a filter panel, `md` in a form.
          It sits in its own block here on purpose — a small box in a column of
          full-size ones puts every label on a different left edge, and a ragged
          column is the one thing this axis must not teach. */}
      <Stack gap={2}>
        <SectionLabel as="h3">In a filter panel</SectionLabel>
        <Checkbox label="Only mine" size="sm" checked onChange={() => undefined} />
        <Checkbox label="Archived" size="sm" checked={false} onChange={() => undefined} />
      </Stack>
    </Stack>
  )
}
