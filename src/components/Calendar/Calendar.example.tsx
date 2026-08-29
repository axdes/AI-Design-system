/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { Row, Stack } from '../Layout'
import { SectionLabel } from '../SectionLabel'
import { Calendar } from './Calendar'

/* Pinned, because this example is also a visual baseline. Left on the current
 * month it drew today's ring wherever today happened to be, so the picture
 * changed by itself every night and the gate failed on the calendar for reasons
 * that had nothing to do with the code. A baseline that depends on the clock
 * measures the clock. */
const MONTH = new Date(2026, 0, 1)

/* A STANDALONE MONTH GRID — the calendar IS the screen, or a whole column of
 * it. For a field that opens one in a popover, reach for <DatePicker>; putting
 * this inside your own popover rebuilds what that component already decided.
 *
 * `weekStartsOn` IS A FACT ABOUT THE READER, NOT A PREFERENCE. Monday starts
 * the week across most of Europe; Sunday starts it in the United States,
 * Canada, Japan and much of the Middle East. Get it wrong and every column is
 * offset by one, which is the kind of error a reader does not notice until they
 * have booked the wrong day. It travels with `locale`, so set both from the
 * same place or neither.
 *
 * Keyboard: arrows move by day, PageUp/PageDown move by month. Month and
 * weekday names come from Intl, so they follow the locale and the writing
 * direction without a table of strings here.
 */
export function Example() {
  const [date, setDate] = useState<Date | undefined>(new Date(2026, 0, 15))
  const [month, setMonth] = useState(MONTH)
  const [usDate, setUsDate] = useState<Date | undefined>(new Date(2026, 0, 15))
  const [usMonth, setUsMonth] = useState(MONTH)

  return (
    <Row gap={8} align="start">
      <Stack gap={2}>
        <SectionLabel as="h3">de-DE</SectionLabel>
        <Calendar
          label="Delivery date"
          locale="de-DE"
          weekStartsOn={1}
          value={date}
          onChange={setDate}
          month={month}
          onMonthChange={setMonth}
        />
      </Stack>

      {/* Same month, same selected day, one column of difference. */}
      <Stack gap={2}>
        <SectionLabel as="h3">en-US</SectionLabel>
        <Calendar
          label="Delivery date"
          locale="en-US"
          weekStartsOn={0}
          value={usDate}
          onChange={setUsDate}
          month={usMonth}
          onMonthChange={setUsMonth}
        />
      </Stack>
    </Row>
  )
}
