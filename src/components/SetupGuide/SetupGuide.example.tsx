/* Golden example. The Shopify lesson the component encodes: first-run and
 * steady-state are ONE page — the guide sits on top, retires step by step,
 * and the dismiss appears only when everything is done. The caller persists
 * the dismissal; a dismissed guide never returns. */
import { useState } from 'react'
import { Button } from '../Button'
import { SetupGuide } from './SetupGuide'

export function Example() {
  const [connected, setConnected] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return <p>The guide is gone for good — the page is all work now.</p>
  return (
    <SetupGuide
      title="Get set up"
      onDismiss={() => setDismissed(true)}
      steps={[
        { id: 'workspace', label: 'Name your workspace', done: true },
        {
          id: 'connect',
          label: 'Connect the data source',
          detail: 'Reports stay empty until one is connected.',
          done: connected,
          action: (
            <Button size="sm" variant="secondary" onClick={() => setConnected(true)}>
              Connect
            </Button>
          ),
        },
      ]}
    />
  )
}
