import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Calendar } from './Calendar'

const JUNE = new Date(2026, 5, 15) // 15 June 2026

describe('Calendar', () => {
  it('renders a labelled grid of days for the value month', () => {
    render(<Calendar value={JUNE} onChange={() => undefined} />)
    expect(screen.getByRole('grid', { name: 'Choose date' })).toBeInTheDocument()
    /* 6 week rows x 7 = 42 day cells. */
    expect(screen.getAllByRole('gridcell')).toHaveLength(42)
    expect(screen.getByRole('gridcell', { selected: true })).toHaveTextContent('15')
  })

  it('selects a day via click', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Calendar value={JUNE} onChange={onChange} />)
    const cell = screen.getAllByRole('gridcell').find((c) => c.textContent === '20' && !c.hasAttribute('data-outside'))!
    await user.click(cell)
    expect(onChange).toHaveBeenCalledTimes(1)
    expect((onChange.mock.calls[0][0] as Date).getDate()).toBe(20)
  })

  it('moves the month with the header arrows', async () => {
    const user = userEvent.setup()
    render(<Calendar value={JUNE} onChange={() => undefined} />)
    expect(screen.getByText('June 2026')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Next month' }))
    expect(screen.getByText('July 2026')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Previous month' }))
    await user.click(screen.getByRole('button', { name: 'Previous month' }))
    expect(screen.getByText('May 2026')).toBeInTheDocument()
  })

  it('does not select a day outside min/max', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Calendar value={JUNE} onChange={onChange} min={new Date(2026, 5, 10)} max={new Date(2026, 5, 20)} />)
    const cell = screen.getAllByRole('gridcell').find((c) => c.textContent === '5' && !c.hasAttribute('data-outside'))!
    await user.click(cell)
    expect(onChange).not.toHaveBeenCalled()
  })
})

describe('Calendar range display', () => {
  it('marks the edges selected and the days between as the band', () => {
    render(
      <Calendar
        rangeStart={new Date(2026, 6, 10)}
        rangeEnd={new Date(2026, 6, 12)}
        month={new Date(2026, 6, 1)}
        onChange={() => undefined}
      />,
    )
    const cell = (n: string) => screen.getAllByRole('gridcell').find((c) => c.textContent === n)!
    expect(cell('10')).toHaveAttribute('aria-selected', 'true')
    expect(cell('12')).toHaveAttribute('aria-selected', 'true')
    expect(cell('11')).toHaveAttribute('data-inrange')
    expect(cell('9')).not.toHaveAttribute('data-inrange')
  })
})
