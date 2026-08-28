/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import type { IconName } from '../Icon'
import { Grid } from '../Layout'
import { SelectableTile } from './SelectableTile'

/* A single-choice set: every tile shares one `name`, which is what makes the
 * browser treat them as one radio group. For multi-select pass `multiple` and
 * drop the name. */
const regions: { id: string; title: string; icon: IconName; description: string; meta: string }[] = [
  { id: 'eu', title: 'Europe', icon: 'location_on', description: 'Frankfurt, Warsaw', meta: 'from 12 ms' },
  { id: 'us', title: 'North America', icon: 'location_on', description: 'Virginia, Oregon', meta: 'from 96 ms' },
]

export function Example() {
  const [region, setRegion] = useState('eu')
  return (
    <Grid gap={3}>
      {regions.map((r) => (
        <SelectableTile
          key={r.id}
          name="region"
          title={r.title}
          icon={r.icon}
          description={r.description}
          meta={r.meta}
          selected={region === r.id}
          onSelect={() => setRegion(r.id)}
        />
      ))}
    </Grid>
  )
}
