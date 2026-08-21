/* Reference solution — what "used the design system" looks like for this task.
 * Doubles as a regression fixture: the scorers must give it a perfect score. */
import { useState } from 'react'
import { Alert } from '@/components/Alert'
import { Button } from '@/components/Button'
import { EmptyState } from '@/components/EmptyState'
import { SegmentedControl } from '@/components/SegmentedControl'
import { Spinner } from '@/components/Spinner'
import { Stack } from '@/components/Layout'

type Status = 'loading' | 'error' | 'empty'

export function Screen() {
  const [status, setStatus] = useState<Status>('loading')

  return (
    <Stack gap={6}>
      <SegmentedControl<Status>
        label="Panel state"
        value={status}
        onChange={setStatus}
        options={[
          { value: 'loading', label: 'Loading' },
          { value: 'error', label: 'Error' },
          { value: 'empty', label: 'Empty' },
        ]}
      />

      {/* The label is the accessible name of the busy region, not decoration: a
        * screen reader announces it, so it says what is being waited for. */}
      {status === 'loading' && <Spinner size="lg" label="Loading the report" />}

      {status === 'error' && (
        <Alert
          tone="danger"
          action={<Button variant="secondary">Try again</Button>}
        >
          The report could not be loaded. The service did not answer in time.
        </Alert>
      )}

      {status === 'empty' && (
        <EmptyState
          icon="description"
          title="No reports yet"
          description="A report appears here once a run finishes. Nothing has run in this workspace."
          action={<Button variant="primary">Create a report</Button>}
        />
      )}
    </Stack>
  )
}
