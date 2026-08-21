/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { FilterBar } from './FilterBar'
import { FilterDropdown } from '../FilterDropdown'

type Status = 'draft' | 'review' | 'published'

/* Wraps FilterDropdowns; `activeCount` drives the clear affordance and the
 * mobile filter count. */
export function Example() {
  const [status, setStatus] = useState<Status[]>([])
  return (
    <FilterBar activeCount={status.length} onClear={() => setStatus([])}>
      <FilterDropdown<Status>
        label="Status"
        allLabel="All statuses"
        multi
        options={[
          { value: 'draft', label: 'Draft' },
          { value: 'review', label: 'In review' },
          { value: 'published', label: 'Published' },
        ]}
        value={status}
        onChange={setStatus}
      />
    </FilterBar>
  )
}
