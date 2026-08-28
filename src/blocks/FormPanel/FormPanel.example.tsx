/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { FormPanel } from './FormPanel'
import { Field } from '../../components/Field'
import { Input } from '../../components/Input'
import { Select } from '../../components/Select'

const OWNERS = [
  { value: 'kira', label: 'Kira Lang' },
  { value: 'sam', label: 'Sam Rivers' },
]

export function Example() {
  const [name, setName] = useState('Discovery workshop')
  const [owner, setOwner] = useState('kira')

  /* The list this panel was opened from stays on screen beside it, which is the
   * whole reason to use a panel instead of a dialog. */
  return (
    <FormPanel title="Edit session" submitLabel="Save changes" onSubmit={() => {}} onClose={() => {}}>
      <Field label="Session name" htmlFor="session-name" required>
        <Input id="session-name" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Owner">
        <Select label="Owner" options={OWNERS} value={owner} onChange={setOwner} />
      </Field>
    </FormPanel>
  )
}
