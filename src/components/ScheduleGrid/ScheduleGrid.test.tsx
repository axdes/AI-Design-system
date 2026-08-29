import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScheduleGrid, type ScheduleEvent } from './ScheduleGrid'

/* What a schedule has to be right about, and none of it is visible to a
 * screenshot: a booking occupies the slots it really occupies, two bookings at
 * one hour are both shown, and a merged cell can still say which room and which
 * hours it belongs to. */

const ROOMS = [{ key: 'atrium', label: 'Atrium' }, { key: 'studio', label: 'Studio' }]
const HOURS = ['09:00', '10:00', '11:00', '12:00'].map((h) => ({ key: h, label: h }))
const EVENTS: ScheduleEvent[] = [
  { id: 'kickoff', resource: 'atrium', from: '09:00', to: '10:00', label: 'Kick-off' },
  { id: 'interview', resource: 'studio', from: '11:00', to: '12:00', label: 'Interview' },
  { id: 'handover', resource: 'studio', from: '12:00', to: '12:00', label: 'Handover' },
]

const grid = () => (
  <ScheduleGrid label="Rooms today" resourceHeader="Room" resources={ROOMS} slots={HOURS} events={EVENTS} now="11:00" />
)

describe('ScheduleGrid', () => {
  it('gives a booking the width of its duration, not one cell per slot', () => {
    render(grid())
    const kickoff = screen.getByText('Kick-off').closest('td')
    /* Two hours is ONE block two slots wide. Printed once per slot it read as
     * two separate bookings of the same name. */
    expect(kickoff).toHaveAttribute('colspan', '2')
    expect(screen.getAllByText('Kick-off')).toHaveLength(1)
  })

  it('names the room and every hour a merged booking covers', () => {
    render(grid())
    const kickoff = screen.getByText('Kick-off').closest('td')
    const headers = kickoff?.getAttribute('headers')?.split(' ') ?? []
    /* One row header plus one per hour it spans: a cell that spans columns
     * cannot be resolved from scope alone. */
    expect(headers).toHaveLength(3)
  })

  it('stacks two bookings at the same hour into lanes instead of hiding one', () => {
    render(grid())
    expect(screen.getByText('Interview')).toBeInTheDocument()
    expect(screen.getByText('Handover')).toBeInTheDocument()
    /* The studio needs two rows for its two overlapping bookings, and its name
     * is written once, spanning them. */
    expect(screen.getByRole('rowheader', { name: 'Studio' })).toHaveAttribute('rowspan', '2')
  })

  it('says which slot is free, and which column is now', () => {
    render(grid())
    /* Free is not silence: an empty cell announces nothing at all. */
    expect(screen.getAllByText('Free').length).toBeGreaterThan(0)
    expect(screen.getByRole('columnheader', { name: '11:00' })).toHaveAttribute('data-now', 'true')
  })

  /* "NOW" IS ONE COLUMN, NOT EVERY COLUMN. A booking is marked as happening now
     only when the current slot is inside it — `now >= from AND now <= to`.
     Widened to OR, every booking on the grid is marked, which is the same as
     marking none. A mutation run did exactly that and nothing failed
     (2026-08-29). */
  it('marks only the booking the current slot falls inside', () => {
    render(<ScheduleGrid label="Rooms" resources={ROOMS} slots={HOURS} events={EVENTS} now="09:00" />)

    const marked = document.querySelectorAll('.schedule-event[data-now]')
    expect(marked).toHaveLength(1)
    expect(marked[0]).toHaveTextContent('Kick-off')
  })
})
