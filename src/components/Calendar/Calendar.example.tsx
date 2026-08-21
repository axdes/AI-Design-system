/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { Calendar } from './Calendar'

/* Pinned, because this example is also a visual baseline. Left on the current
 * month it drew today's ring wherever today happened to be, so the picture
 * changed by itself every night and the gate failed on the calendar for reasons
 * that had nothing to do with the code. A baseline that depends on the clock
 * measures the clock. */
const MONTH = new Date(2026, 0, 1)

export function Example() {
  const [date, setDate] = useState<Date | undefined>(new Date(2026, 0, 15))
  const [month, setMonth] = useState(MONTH)

  /* Standalone month grid. Keyboard: arrows move day, PageUp/Down move month.
   * Month/weekday names come from Intl (locale + RTL aware). For a field that
   * opens this in a popover, use <DatePicker>. */
  return <Calendar value={date} onChange={setDate} month={month} onMonthChange={setMonth} />
}
