/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { FilterDropdown } from './FilterDropdown'

type Status = 'draft' | 'review' | 'published'

export function Example() {
  const [status, setStatus] = useState<Status[]>([])

  /* Typed by the option value: `value`/`onChange` speak Status, not string.
   * An empty array means "all", which is what `allLabel` renders on the chip. */
  return (
    <FilterDropdown<Status>
      label="Status"
      allLabel="All statuses"
      multiple
      options={[
        { value: 'draft', label: 'Draft', count: 4 },
        { value: 'review', label: 'In review', count: 2 },
        { value: 'published', label: 'Published', count: 11 },
      ]}
      value={status}
      onChange={setStatus}
    />
  )
}
