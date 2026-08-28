/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { Field } from '../Field'
import { Input } from '../Input'
import { InputGroup } from './InputGroup'

export function Example() {
  const [value, setValue] = useState('acme-handbook')

  /* The scheme is not something anyone types, so it is an affix rather than
   * part of the value — the field holds the slug and nothing else. `Field`
   * around it still owns the label and any message. */
  return (
    <Field label="Workspace address" htmlFor="workspace-slug">
      <InputGroup prefix="https://" suffix=".example.com">
        <Input
          id="workspace-slug"
          value={value}
          onChange={(e) => { setValue(e.target.value) }}
        />
      </InputGroup>
    </Field>
  )
}
