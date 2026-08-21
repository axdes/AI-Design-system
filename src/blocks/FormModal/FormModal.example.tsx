/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { FormModal } from './FormModal'
import { Field } from '../../components/Field'
import { Input } from '../../components/Input'

export function Example() {
  const [open, setOpen] = useState(true)
  const [name, setName] = useState('Q3 report')

  return (
    <FormModal open={open} title="Rename" onConfirm={() => setOpen(false)} onClose={() => setOpen(false)}>
      <Field label="Name" htmlFor="rename-name" required>
        <Input id="rename-name" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
    </FormModal>
  )
}
