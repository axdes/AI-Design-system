/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { DateBlock } from './DateBlock'
import { Card } from '../Card'
import { Row, Stack } from '../Layout'
import { SectionLabel } from '../SectionLabel'

/* A DATE THE EYE LANDS ON. A list of sessions is scanned BY date, so the date
 * gets its own block beside the title and never a line under it. When the date
 * is provenance rather than the thing being scanned — "edited two days ago" —
 * it is <Time>, and a block for it shouts about something nobody is looking for.
 *
 * `tone` says what the date MEANS to the row, and it comes from the state of
 * the thing, not from how close the date is: `neutral` is a date on the
 * calendar, `primary` is the one being looked at, `warning` is due, `danger` is
 * past due. A block that reddens as a date approaches tells the reader the
 * calendar is the problem.
 *
 * `size` follows how the row is used: `md` when the date leads a list the
 * reader is scanning, `sm` when the block sits inside a denser row and the
 * title is what leads.
 */
export function Example() {
  return (
    <Stack gap={6}>
      <Stack gap={2}>
        <SectionLabel as="h3">Upcoming sessions</SectionLabel>
        <Card>
          <Row gap={4} align="center">
            <DateBlock value="2026-09-30T09:00:00Z" tone="primary" />
            <span>Design sprint, day one</span>
          </Row>
        </Card>
        <Card>
          <Row gap={4} align="center">
            <DateBlock value="2026-10-02T09:00:00Z" />
            <span>Delivery review</span>
          </Row>
        </Card>
      </Stack>

      {/* Denser row, and the date is overdue rather than merely next. */}
      <Card>
        <Row gap={3} align="center">
          <DateBlock value="2026-08-14T09:00:00Z" tone="danger" size="sm" />
          <span>Safety audit, not yet signed off</span>
        </Row>
      </Card>
    </Stack>
  )
}
