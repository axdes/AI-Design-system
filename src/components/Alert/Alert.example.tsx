/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { Button } from '../Button'
import { Stack } from '../Layout'
import { Alert } from './Alert'

export function Example() {
  const [showTip, setShowTip] = useState(true)
  return (
    <Stack gap={3}>
      {/* An unfixed error stays: no onDismiss, and role="alert" to interrupt. */}
      <Alert tone="danger" role="alert">Couldn&apos;t save. Check your connection.</Alert>
      {/* Dismissal is the consumer's: the alert never unmounts itself. */}
      {showTip && <Alert tone="info" onDismiss={() => setShowTip(false)}>Drafts save automatically.</Alert>}
      {/* An alert that asks for something carries the ask. The action stands on a
        * TINT, which is the one surface a quiet fill cannot separate from — the
        * example exists so a baseline covers it. */}
      <Alert tone="warning" action={<Button variant="secondary" size="sm">Reconnect</Button>}>
        The editor lost the connection two minutes ago.
      </Alert>
    </Stack>
  )
}
