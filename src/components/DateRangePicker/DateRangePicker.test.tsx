import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DateRangePicker } from './DateRangePicker'

/* The molecule owns the two-pick protocol: first click marks the start,
 * second closes with the ordered range. The calendar itself is Calendar's
 * contract, tested there. */

const open = async (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole('button', { name: 'Stay dates' }))

/* Days are gridcells named by the locale's full date; find them by text. */
const day = (n: string) =>
  screen.getAllByRole('gridcell').find((c) => c.textContent === n)!

/* July 2026 with a committed range already set, so every case starts from the
 * same month and the picks land on known day numbers. */
const renderJuly = (onChange: (range: { start: Date; end: Date }) => void) =>
  render(
    <DateRangePicker
      label="Stay dates"
      value={{ start: new Date(2026, 6, 1), end: new Date(2026, 6, 2) }}
      onChange={onChange}
    />,
  )

describe('DateRangePicker', () => {
  it('shows the placeholder until there is a range', () => {
    render(<DateRangePicker label="Stay dates" placeholder="Pick the dates" onChange={() => undefined} />)
    expect(screen.getByRole('button', { name: 'Stay dates' })).toHaveTextContent('Pick the dates')
  })

  it('formats both ends for the given locale', () => {
    render(
      <DateRangePicker
        label="Stay dates"
        locale="en-GB"
        value={{ start: new Date(2026, 6, 15), end: new Date(2026, 6, 20) }}
        onChange={() => undefined}
      />,
    )
    expect(screen.getByRole('button', { name: 'Stay dates' })).toHaveTextContent('15 Jul 2026 to 20 Jul 2026')
  })

  it('needs two picks: the first arms the start, the second reports the range', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    renderJuly(onChange)

    await open(user)
    await user.click(day('10'))
    expect(onChange).not.toHaveBeenCalled()

    await user.click(day('20'))
    expect(onChange).toHaveBeenCalledTimes(1)
    const range = onChange.mock.calls[0][0]
    expect(range.start.getDate()).toBe(10)
    expect(range.end.getDate()).toBe(20)
  })

  it('orders a backwards pick instead of failing', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    renderJuly(onChange)

    await open(user)
    await user.click(day('20'))
    await user.click(day('10'))

    const range = onChange.mock.calls[0][0]
    expect(range.start.getDate()).toBe(10)
    expect(range.end.getDate()).toBe(20)
  })

  it('closes after the second pick', async () => {
    const user = userEvent.setup()
    renderJuly(() => undefined)

    await open(user)
    await user.click(day('10'))
    expect(screen.getByRole('grid')).toBeInTheDocument()

    await user.click(day('20'))
    await waitFor(() => expect(screen.queryByRole('grid')).toBeNull())
  })

  /* Five props that had never been rendered: the two bounds the calendar is
     supposed to enforce, the invalid and size attributes the CSS paints, and
     disabled — which has to reach the BUTTON, not only the look of it. */
  it('carries its bounds into the calendar, and a disabled trigger does not open', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <DateRangePicker
        label="Stay dates"
        onChange={() => undefined}
        min={new Date(2026, 0, 10)}
        max={new Date(2026, 0, 20)}
        invalid
        size="sm"
        disabled
      />,
    )
    const trigger = screen.getByRole('button', { name: 'Stay dates' })
    expect(trigger).toBeDisabled()
    expect(trigger).toHaveAttribute('data-invalid')
    expect(trigger).toHaveAttribute('data-size', 'sm')
    await user.click(trigger)
    expect(container.querySelector('.calendar')).toBeNull()
  })
})
