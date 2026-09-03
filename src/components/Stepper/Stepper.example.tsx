/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { Stepper } from './Stepper'

export function Example() {
  const [step, setStep] = useState(1)

  /* Presentational: the parent owns `current`. Completed steps are clickable to
   * go back (upcoming ones are not); the wizard body lives next to this. */
  return (
    <Stepper
      currentIndex={step}
      onSelect={setStep}
      steps={[
        { label: 'Account', description: 'Your details' },
        { label: 'Shipping', description: 'Where to send it' },
        { label: 'Payment', description: 'How to pay' },
        { label: 'Review', description: 'Confirm and place' },
      ]}
    />
  )
}
