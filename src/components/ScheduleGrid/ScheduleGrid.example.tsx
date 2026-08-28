/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { ScheduleGrid, type ScheduleEvent } from './ScheduleGrid'

const ROOMS = [
  { key: 'atrium', label: 'Atrium' },
  { key: 'north', label: 'North room' },
  { key: 'studio', label: 'Studio' },
]
const HOURS = ['09:00', '10:00', '11:00', '12:00', '13:00'].map((h) => ({ key: h, label: h }))

/* A booking is a RANGE: `from` and `to` are the first and the last slot it
   occupies, so two hours is one block two slots wide. The last two overlap in
   the Studio on purpose — they stack into two lanes instead of covering each
   other, which is what a schedule has to show rather than hide. */
const EVENTS: ScheduleEvent[] = [
  { id: 'kickoff', resource: 'atrium', from: '09:00', to: '10:00', label: 'Kick-off', tone: 'primary' },
  { id: 'review', resource: 'north', from: '11:00', to: '11:00', label: 'Design review' },
  { id: 'recording', resource: 'studio', from: '09:00', to: '09:00', label: 'Recording' },
  { id: 'interview', resource: 'studio', from: '12:00', to: '13:00', label: 'Interview' },
  { id: 'handover', resource: 'studio', from: '13:00', to: '13:00', label: 'Handover', tone: 'warning' },
]

export function Example() {
  return (
    <ScheduleGrid
      label="Room bookings today"
      captionHidden
      resourceHeader="Room"
      resources={ROOMS}
      slots={HOURS}
      events={EVENTS}
      /* The column that is happening now, marked so the reader does not have to
         work it out from the clock. */
      now="11:00"
    />
  )
}
