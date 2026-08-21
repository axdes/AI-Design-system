/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { FormStack } from './FormStack'
import { Field } from '../Field'
import { Input } from '../Input'
import { Select } from '../Select'

export function Example() {
  const [name, setName] = useState('')
  const [role, setRole] = useState('editor')

  /* FormStack owns the vertical rhythm between fields — do not add margins to
   * the <Field>s themselves. */
  return (
    <FormStack>
      <Field label="Full name" htmlFor="user-name" required>
        <Input id="user-name" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Role" htmlFor="user-role">
        <Select
          label="Role"
          value={role}
          onChange={setRole}
          options={[
            { value: 'editor', label: 'Editor' },
            { value: 'viewer', label: 'Viewer' },
          ]}
        />
      </Field>
    </FormStack>
  )
}
