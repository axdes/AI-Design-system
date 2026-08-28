/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { FormPageTemplate } from './FormPageTemplate'
import { Field } from '../../components/Field'
import { FormSection } from '../../components/FormSection'
import { Input } from '../../components/Input'
import { Select } from '../../components/Select'
import { Textarea } from '../../components/Textarea'
import type { FormError } from '../../components/ErrorSummary'

const AREAS = [
  { value: 'emea', label: 'EMEA' },
  { value: 'amer', label: 'AMER' },
]

export function Example() {
  const [name, setName] = useState('')
  const [area, setArea] = useState('emea')
  const [purpose, setPurpose] = useState('')
  const [errors, setErrors] = useState<FormError[]>([])

  /* Validation runs on submit and answers in one place: the summary above the
   * first field, plus the message on the field itself. The ids match the
   * control ids, which is what lets a summary row put the caret in the field. */
  const submit = () => {
    setErrors(name.trim() ? [] : [{ id: 'ws-name', message: 'Enter a name for the workspace' }])
  }

  return (
    <FormPageTemplate
      title="New workspace"
      errors={errors}
      dirty={Boolean(name || purpose)}
      submitLabel="Create workspace"
      onSubmit={submit}
      onCancel={() => setErrors([])}
    >
      <FormSection title="Identity" description="What the team will see in their list.">
        <Field
          label="Workspace name"
          htmlFor="ws-name"
          required
          error={errors.length ? 'Enter a name for the workspace' : undefined}
        >
          <Input id="ws-name" value={name} invalid={errors.length > 0} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Purpose" htmlFor="ws-purpose" optional hint="One line, shown under the name.">
          <Textarea id="ws-purpose" rows={2} value={purpose} onChange={(e) => setPurpose(e.target.value)} />
        </Field>
      </FormSection>
      <FormSection title="Ownership">
        <Field label="Area">
          <Select label="Area" options={AREAS} value={area} onChange={setArea} />
        </Field>
      </FormSection>
    </FormPageTemplate>
  )
}
