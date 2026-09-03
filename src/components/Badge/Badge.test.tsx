import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from './Badge'

/* A word about a state. It has no behaviour at all, and the two things it does
 * own are worth pinning: the tone is always present (so CSS never has to guess
 * a default) and everything else a caller passes reaches the element, which is
 * how a badge gets a title or an id from the screen around it. */

describe('Badge', () => {
  it('always carries a tone, so nothing downstream has to guess one', () => {
    const { rerender } = render(<Badge>Draft</Badge>)
    expect(screen.getByText('Draft')).toHaveAttribute('data-tone', 'neutral')

    rerender(<Badge tone="danger">Overdue</Badge>)
    expect(screen.getByText('Overdue')).toHaveAttribute('data-tone', 'danger')
  })

  it('leaves fill and size absent rather than inventing values for them', () => {
    render(<Badge>Draft</Badge>)
    const badge = screen.getByText('Draft')
    expect(badge).not.toHaveAttribute('data-fill')
    expect(badge).not.toHaveAttribute('data-size')
  })

  it('passes anything else through to the element it owns', () => {
    render(<Badge id="state" title="Current state">Active</Badge>)
    const badge = screen.getByText('Active')
    expect(badge).toHaveAttribute('id', 'state')
    expect(badge).toHaveAttribute('title', 'Current state')
  })
})
