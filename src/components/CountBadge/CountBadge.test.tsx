import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CountBadge } from './CountBadge'
import { Icon } from '../Icon/Icon'

/* A marker pinned to somebody else's corner. Its whole contract is when it
 * appears and what it says: a zero that draws a badge is a red dot telling you
 * to look at nothing. */

describe('CountBadge', () => {
  it('says nothing when there is nothing to say', () => {
    render(<CountBadge count={0} label="0 unread"><Icon name="search" /></CountBadge>)
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('shows the count when there is one', () => {
    render(<CountBadge count={3} label="3 unread"><Icon name="search" /></CountBadge>)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  /* Past the ceiling the exact number stops being the point and the width
   * starts being one: "100" in a corner marker pushes the thing it is pinned to. */
  it('stops counting at its ceiling', () => {
    const { rerender } = render(<CountBadge count={99} label="99 unread"><Icon name="search" /></CountBadge>)
    expect(screen.getByText('99')).toBeInTheDocument()

    rerender(<CountBadge count={140} label="over 99 unread"><Icon name="search" /></CountBadge>)
    expect(screen.getByText('99+')).toBeInTheDocument()

    rerender(<CountBadge count={12} max={9} label="over 9 unread"><Icon name="search" /></CountBadge>)
    expect(screen.getByText('9+')).toBeInTheDocument()
  })

  it('draws a dot with no number when asked for one, count or not', () => {
    render(<CountBadge dot count={4} label="Unread messages"><Icon name="search" /></CountBadge>)
    /* The words are the whole marker for a screen reader: the dot itself is a
     * shape, and a shape announces nothing. */
    expect(screen.getByText('Unread messages')).toBeInTheDocument()
    expect(screen.queryByText('4')).not.toBeInTheDocument()
  })

  /* Without a label the marker is hidden from screen readers on purpose: an
   * unexplained "3" beside an icon is noise, and the thing it counts is already
   * said by whatever it is pinned to. */
  it('hides itself from a screen reader when nobody said what it counts', () => {
    const { container } = render(<CountBadge count={3}><Icon name="search" /></CountBadge>)
    expect(container.querySelector('.count-badge-marker')).toHaveAttribute('aria-hidden', 'true')
  })
})
