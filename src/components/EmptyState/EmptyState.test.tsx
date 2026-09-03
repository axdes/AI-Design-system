import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EmptyState } from './EmptyState'

/* The screen a person reaches when there is nothing to see. Everything about it
 * is optional except the title and the two things that make it findable: it is
 * a live region, and its title takes the heading LEVEL the page gives it rather
 * than the size it wants to look. */

describe('EmptyState', () => {
  it('takes the heading level the outline needs, not the one it looks like', () => {
    const { rerender } = render(<EmptyState title="No sessions yet" />)
    expect(screen.getByRole('heading', { level: 2, name: 'No sessions yet' })).toBeInTheDocument()

    rerender(<EmptyState title="No sessions yet" as="h3" />)
    expect(screen.getByRole('heading', { level: 3, name: 'No sessions yet' })).toBeInTheDocument()
  })

  it('announces itself, because arriving at nothing is a result', () => {
    render(<EmptyState title="No results" />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('is a title and nothing else when nothing else was given', () => {
    const { container } = render(<EmptyState title="No results" />)
    expect(container.querySelector('.empty-state-description')).toBeNull()
    expect(container.querySelector('.empty-state-action')).toBeNull()
    expect(container.querySelector('.empty-state-icon')).toBeNull()
  })

  it('carries the way out when there is one', () => {
    render(<EmptyState title="No sessions yet" description="Start one to see it here." action={<button>Start a session</button>} />)
    expect(screen.getByText('Start one to see it here.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start a session' })).toBeInTheDocument()
  })
})
