import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DatePicker } from './DatePicker'

/* The field owns three things and delegates the rest: how the chosen date reads,
 * that picking a day closes the calendar, and that the trigger is named. The
 * closing is the fragile one — it works by remounting the Popover, so an
 * innocent refactor of that key leaves the calendar hanging open. */

const open = async (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole('button', { name: 'Due date' }))

/* Days are gridcells (grid > row > gridcell), named by the locale's full date
 * format, so they are found by their text rather than by an accessible name. */
const day = (n: string) =>
  screen.getAllByRole('gridcell').find((c) => c.textContent === n)!

describe('DatePicker', () => {
  it('shows the placeholder until there is a date', () => {
    render(<DatePicker label="Due date" placeholder="Pick a day" onChange={() => undefined} />)
    expect(screen.getByRole('button', { name: 'Due date' })).toHaveTextContent('Pick a day')
  })

  it('formats the chosen date for the given locale', () => {
    render(<DatePicker label="Due date" locale="en-GB" value={new Date(2026, 6, 31)} onChange={() => undefined} />)

    /* Intl, not a hand-rolled format string: "31 Jul 2026" in en-GB, and the
     * month name follows the locale rather than the developer's. */
    expect(screen.getByRole('button', { name: 'Due date' })).toHaveTextContent('31 Jul 2026')
  })

  it('opens a calendar and hands back the day that was picked', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<DatePicker label="Due date" value={new Date(2026, 6, 15)} onChange={onChange} />)

    await open(user)
    await user.click(day('15'))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange.mock.calls[0][0]).toBeInstanceOf(Date)
  })

  it('closes once a day is picked', async () => {
    const user = userEvent.setup()
    render(<DatePicker label="Due date" value={new Date(2026, 6, 15)} onChange={() => undefined} />)

    await open(user)
    expect(screen.getByRole('grid')).toBeInTheDocument()

    await user.click(day('15'))

    await waitFor(() => expect(screen.queryByRole('grid')).toBeNull())
  })

  it('does not open while disabled', async () => {
    const user = userEvent.setup()
    render(<DatePicker label="Due date" disabled onChange={() => undefined} />)

    const trigger = screen.getByRole('button', { name: 'Due date' })
    expect(trigger).toBeDisabled()
    await user.click(trigger)
    expect(screen.queryByRole('grid')).toBeNull()
  })

  it('passes the bounds down to the calendar', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(
      <DatePicker
        label="Due date"
        value={new Date(2026, 6, 15)}
        min={new Date(2026, 6, 10)}
        max={new Date(2026, 6, 20)}
        onChange={onChange}
      />,
    )

    await open(user)
    /* Out of range: the calendar must refuse it rather than the caller. */
    expect(day('5')).toBeDisabled()
    expect(day('15')).toBeEnabled()
  })
})
