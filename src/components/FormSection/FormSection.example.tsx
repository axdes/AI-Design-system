/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { FormSection } from './FormSection'
import { Field } from '../Field'
import { Input } from '../Input'
import { Select } from '../Select'

const AREAS = [
  { value: 'emea', label: 'EMEA' },
  { value: 'amer', label: 'AMER' },
]

export function Example() {
  const [name, setName] = useState('Delivery review')
  const [area, setArea] = useState('emea')

  /* The legend answers "what are these fields about"; if no sentence can say
   * that, the fields do not form a section and belong in the plain FormStack. */
  return (
    <FormSection title="Ownership" description="Who this workspace belongs to.">
      <Field label="Workspace name" htmlFor="ws-name" required>
        <Input id="ws-name" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Area">
        <Select label="Area" options={AREAS} value={area} onChange={setArea} />
      </Field>
    </FormSection>
  )
}
