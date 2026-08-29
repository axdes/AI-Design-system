/* Golden example. A real module: tsc compiles it, the test suite renders it,
 * the registry publishes the usage. The shape to copy: steps freely navigable,
 * the last step a WizardReview whose Change links jump back, and the submit
 * naming the real event — never "Submit". */
import { useState } from 'react'
import { Field } from '../../components/Field'
import { Input } from '../../components/Input'
import { Select } from '../../components/Select'
import { WizardTemplate, WizardReview, WizardReviewRow } from './WizardTemplate'

/* A WIZARD IS FOR ONE TASK TOO BIG FOR ONE SCREEN, and nothing else. Cutting a
 * short form into three steps does not make it simpler; it takes away the
 * reader's ability to see what they are being asked before they start.
 *
 * THE STEPS ARE FREELY NAVIGABLE. A reader who realises on step three that
 * they got step one wrong must be able to go straight there — a wizard that
 * only moves forward turns a typo into starting again. That is also why the
 * last step is a REVIEW whose Change links jump back: it is the same
 * navigation, offered at the moment the reader most wants it.
 *
 * `submitLabel` NAMES THE REAL EVENT — "Create schedule", never "Submit" or
 * "Finish". The last press of a wizard is the one that changes something in
 * the world, and the reader has a right to know what before they make it.
 *
 * `onStep` is where validation belongs if there is any: refuse the move and
 * say why, rather than letting the reader reach the review and find a step
 * they cannot fix from there.
 */
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
