import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SaveStatus } from './SaveStatus'

/* A form that saves by itself has to say so, and this is the whole of what it
 * says. The state that matters most is the one with nothing in it: idle must
 * announce NOTHING, because a live region that speaks when nothing happened
 * teaches people to ignore it. */

describe('SaveStatus', () => {
  it('is a live region, always, so a later save is announced rather than appearing', () => {
    render(<SaveStatus state="idle" />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('says nothing at all while there is nothing to report', () => {
    render(<SaveStatus state="idle" />)
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it('reports each state in words rather than in a colour', () => {
    const { rerender } = render(<SaveStatus state="saving" />)
    expect(screen.getByRole('status')).toHaveTextContent(/sav/i)

    rerender(<SaveStatus state="error" />)
    expect(screen.getByRole('status')).not.toBeEmptyDOMElement()
    expect(screen.getByRole('status')).toHaveAttribute('data-state', 'error')
  })

  /* "Saved" with no time is a claim about the past with no date on it: the one
   * question a person has after an autosave is WHEN. */
  it('carries the time of the last save when it has one, and does not invent one', () => {
    const { container, rerender } = render(<SaveStatus state="saved" at="2026-03-09T10:00:00Z" />)
    expect(container.querySelector('time')).toBeInTheDocument()

    rerender(<SaveStatus state="saved" />)
    expect(container.querySelector('time')).toBeNull()
  })
})
