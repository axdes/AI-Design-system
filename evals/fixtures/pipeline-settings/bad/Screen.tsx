/* The tempting wrong answer: settings walked as a one-time wizard. Every
 * component and prop is real — only the decisions are wrong. */
import { useState } from 'react'
import { WizardTemplate } from '@/blocks/WizardTemplate'
import { Field } from '@/components/Field'
import { Input } from '@/components/Input'

const STEPS = [
  { id: 'host', label: 'Host' },
  { id: 'sender', label: 'Sender' },
  { id: 'token', label: 'Token' },
  { id: 'cadence', label: 'Cadence' },
]

export function Screen() {
  const [current, setCurrent] = useState('host')
  const [host, setHost] = useState('')
  return (
    <WizardTemplate
      title="Relay setup"
      steps={STEPS}
      current={current}
      onSelect={setCurrent}
      submitLabel="Finish setup"
      onSubmit={() => undefined}
    >
      <Field label="SMTP host" htmlFor="wiz-host">
        <Input id="wiz-host" value={host} onChange={(e) => setHost(e.target.value)} />
      </Field>
    </WizardTemplate>
  )
}
