/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Time } from './Time'
import { Stack } from '../Layout'

/* Fixed instants so the example is the same picture on every run. In a product
 * these are whatever the record carries. */
const EDITED = '2026-08-08T09:12:00.000Z'
const JOINED = '2024-03-02T10:00:00.000Z'

export function Example() {
  return (
    <Stack gap={1}>
      {/* auto: relative while it is recent, the full date once it is not. */}
      <Time value={EDITED} />
      <Time value={JOINED} />
    </Stack>
  )
}
