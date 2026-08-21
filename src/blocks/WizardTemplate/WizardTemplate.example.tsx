/* Golden example. A real module: tsc compiles it, the test suite renders it,
 * the registry publishes the usage. The shape to copy: steps freely navigable,
 * the last step a WizardReview whose Change links jump back, and the submit
 * naming the real event — never "Submit". */
import { useState } from 'react'
import { Field } from '../../components/Field'
import { Input } from '../../components/Input'
import { Select } from '../../components/Select'
import { WizardTemplate, WizardReview, WizardReviewRow } from './WizardTemplate'

const STEPS = [
  { id: 'details', label: 'Details' },
  { id: 'scope', label: 'Scope' },
  { id: 'review', label: 'Review' },
]

export function Example() {
  const [step, setStep] = useState('details')
  const [name, setName] = useState('Weekly export')
  const [scope, setScope] = useState('all')
  return (
    <WizardTemplate
      title="New export schedule"
      steps={STEPS}
      current={step}
      onStep={setStep}
      submitLabel="Create schedule"
      onSubmit={() => setStep('details')}
    >
      {step === 'details' && (
        <Field label="Schedule name" htmlFor="wiz-name">
          <Input id="wiz-name" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
      )}
      {step === 'scope' && (
        <Select
          label="Scope"
          value={scope}
          onChange={setScope}
          options={[
            { value: 'all', label: 'Whole workspace' },
            { value: 'mine', label: 'My documents' },
          ]}
        />
      )}
      {step === 'review' && (
        <WizardReview>
          <WizardReviewRow label="Schedule name" onEdit={() => setStep('details')}>
            {name}
          </WizardReviewRow>
          <WizardReviewRow label="Scope" onEdit={() => setStep('scope')}>
            {scope === 'all' ? 'Whole workspace' : 'My documents'}
          </WizardReviewRow>
        </WizardReview>
      )}
    </WizardTemplate>
  )
}
