/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Time } from './Time'
import { SectionLabel } from '../SectionLabel'
import { Stack } from '../Layout'

/* Fixed instants so the example is the same picture on every run. In a product
 * these are whatever the record carries. */
const EDITED = '2026-08-08T09:12:00.000Z'
const JOINED = '2024-03-02T10:00:00.000Z'

/* `auto` IS THE ANSWER ALMOST EVERY TIME, and it is the default for a reason:
 * a reader thinks "five minutes ago" about something recent and thinks "2 March
 * 2024" about something that is not. Nobody counts 894 days, and nobody wants a
 * timestamp to the second on a comment posted while they were reading.
 *
 * Force a mode only when the screen makes one of them wrong:
 *
 * `relative` when RECENCY IS THE POINT and the reader is watching — a live
 * feed, a queue, "last synced". The cost is that it stops being useful the
 * moment the thing is a week old.
 *
 * `absolute` when the exact instant IS THE RECORD and someone may have to quote
 * it — an audit trail, a contract date, an incident timeline. "3 hours ago" is
 * not something you can put in a ticket.
 *
 * Whichever mode is showing, the component renders a `<time datetime>` carrying
 * the full instant, so the machine-readable value never depends on the display.
 */
export function Example() {
  return (
    <Stack gap={6}>
      <Stack gap={1}>
        <SectionLabel as="h3">Auto</SectionLabel>
        {/* Recent, so it reads relative; old, so it reads as a date. One prop,
            both behaviours, no branch in the calling code. */}
        <Time value={EDITED} />
        <Time value={JOINED} />
      </Stack>

      <Stack gap={1}>
        <SectionLabel as="h3">Forced</SectionLabel>
        <Time value={JOINED} mode="relative" />
        <Time value={EDITED} mode="absolute" />
      </Stack>
    </Stack>
  )
}
