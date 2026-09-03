/* Reference solution — what "used the design system" looks like for this task.
 * Doubles as a regression fixture: the scorers must give it a perfect score. */
import { useState } from 'react'
import { Accordion } from '@/components/Accordion'
import { Stack } from '@/components/Layout'
import { Stepper } from '@/components/Stepper'

export function Screen() {
  const [step, setStep] = useState(2)

  return (
    <Stack gap={6}>
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

      <Accordion
        defaultOpen={['delivery']}
        items={[
          { id: 'delivery', title: 'When will it arrive?', content: 'Orders ship in 2 to 4 business days.' },
          { id: 'returns', title: 'Can I return it?', content: 'Yes, free returns within 30 days.' },
          { id: 'payment', title: 'Which cards do you take?', content: 'Mada, Visa and Mastercard.' },
        ]}
      />
    </Stack>
  )
}
