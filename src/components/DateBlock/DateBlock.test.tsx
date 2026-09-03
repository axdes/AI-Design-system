import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DateBlock } from './DateBlock'

/* A date the eye lands on before it reads anything. Three things can go wrong
 * and only one of them is visible: the wrong day, a machine-readable value that
 * disagrees with the printed one, and a bad input rendering as "Invalid Date"
 * in 24pt type. */

describe('DateBlock', () => {
  it('takes the three shapes a date arrives in and prints the same day', () => {
    const iso = '2026-03-09T10:00:00Z'
    for (const value of [iso, Date.parse(iso), new Date(iso)]) {
      const { unmount } = render(<DateBlock value={value} locale="en-GB" />)
      expect(screen.getByText('9')).toBeInTheDocument()
      expect(screen.getByText('Mar')).toBeInTheDocument()
      unmount()
    }
  })

  /* The machine-readable instant travels with the human one, or a date that
   * reads right to a person is unusable to anything else. */
  it('carries the instant beside the day', () => {
    const { container } = render(<DateBlock value="2026-03-09T10:00:00Z" locale="en-GB" />)
    expect(container.querySelector('time')).toHaveAttribute('dateTime', '2026-03-09T10:00:00.000Z')
  })

  it('renders nothing rather than "Invalid Date" in the largest type on the card', () => {
    const { container } = render(<DateBlock value="not a date" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('follows the locale it is given, not the machine it runs on', () => {
    render(<DateBlock value="2026-03-09T10:00:00Z" locale="de-DE" />)
    expect(screen.getByText('Mär')).toBeInTheDocument()
  })
})
