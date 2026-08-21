/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
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
    </Stack>
  )
}
