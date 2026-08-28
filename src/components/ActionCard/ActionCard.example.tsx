/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { Button } from '../Button'
import { Descriptions } from '../Descriptions'
import { MetaItem } from '../MetaItem'
import { ActionCard } from './ActionCard'

/* The whole point of the family: the answer is given here, and the card then
 * says what the answer was. `resolved` replaces the actions, so the request
 * cannot be answered twice. */
export function Example() {
  const [outcome, setOutcome] = useState<'success' | 'danger' | null>(null)

  return (
    <ActionCard
      eyebrow="Access request"
      title="Give Maksim Barysau access to the coach cockpit?"
      meta={<MetaItem icon="schedule">Asked 2 hours ago</MetaItem>}
      resolved={
        outcome
          ? { tone: outcome, text: outcome === 'success' ? 'Approved by you' : 'Declined by you' }
          : undefined
      }
      actions={
        <>
          <Button onClick={() => setOutcome('success')}>Approve</Button>
          <Button variant="secondary" onClick={() => setOutcome('danger')}>
            Decline
          </Button>
        </>
      }
    >
      <Descriptions
        layout="inline"
        items={[
          { term: 'Role', value: 'Front-end Engineer' },
          { term: 'Team', value: 'Wave 3, Warsaw' },
          { term: 'Access until', value: '31 Dec 2026' },
        ]}
      />
    </ActionCard>
  )
}
