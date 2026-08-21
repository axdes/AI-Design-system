import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { Time } from './Time'

/* A relative label alone is not a timestamp: it cannot be parsed, sorted or
 * checked. What this guards is that the exact instant is always there too. */

const NOW = new Date('2026-08-08T12:00:00.000Z')

describe('Time', () => {
  beforeEach(() => { vi.useFakeTimers({ shouldAdvanceTime: true }); vi.setSystemTime(NOW) })
  afterEach(() => { vi.useRealTimers() })

  it('renders a real <time> carrying the machine-readable instant', () => {
    render(<Time value="2026-08-08T10:00:00.000Z" locale="en-GB" />)
    const el = screen.getByText(/hours ago/)
    expect(el.tagName).toBe('TIME')
    expect(el).toHaveAttribute('datetime', '2026-08-08T10:00:00.000Z')
    expect(el.getAttribute('title')).toMatch(/2026/)
  })

  it('goes absolute once the instant is over a week old', () => {
    render(<Time value="2026-06-01T10:00:00.000Z" locale="en-GB" />)
    expect(screen.queryByText(/ago/)).toBeNull()
    expect(screen.getByText(/2026/)).toBeInTheDocument()
  })

  it('honours an explicit mode over the age', () => {
    const { rerender } = render(<Time value="2026-06-01T10:00:00.000Z" mode="relative" locale="en-GB" />)
    expect(screen.getByText(/ago/)).toBeInTheDocument()

    rerender(<Time value="2026-08-08T11:59:30.000Z" mode="absolute" locale="en-GB" />)
    expect(screen.queryByText(/ago/)).toBeNull()
  })

  it('follows the locale rather than shipping English', () => {
    render(<Time value="2026-08-08T10:00:00.000Z" locale="ar" />)
    expect(screen.queryByText(/hours ago/)).toBeNull()
  })

  it('shows what it was given when the date cannot be parsed', () => {
    render(<Time value="not a date" />)
    expect(screen.getByText('not a date')).toBeInTheDocument()
  })

  it('re-reads the clock as time passes', () => {
    render(<Time value={NOW.toISOString()} locale="en-GB" />)
    expect(screen.getByText(/now/)).toBeInTheDocument()

    /* act(), because the re-read happens in a timeout rather than in an event. */
    act(() => { vi.advanceTimersByTime(5 * 60_000) })
    expect(screen.getByText(/minutes ago/)).toBeInTheDocument()
  })
})
