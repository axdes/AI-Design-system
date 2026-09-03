import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TagGroup } from './TagGroup'

/* Tags in a cell, where there is room for two of them. The overflow is the
 * whole component: a "+3" nobody can resolve is a number, and a number is not a
 * label — so the names it hides are still IN the element for anyone reading
 * with their ears. */

describe('TagGroup', () => {
  it('shows everything while everything fits', () => {
    render(<TagGroup items={['Design', 'Research']} />)
    expect(screen.getByText('Design')).toBeInTheDocument()
    expect(screen.getByText('Research')).toBeInTheDocument()
    expect(screen.queryByText(/\+/)).not.toBeInTheDocument()
  })

  it('counts the rest and still names them', () => {
    const { container } = render(<TagGroup items={['Design', 'Research', 'Delivery', 'Ops']} />)
    const more = container.querySelector('.tag-group-more')
    expect(more).toBeInTheDocument()
    expect(more?.textContent).toContain('Delivery, Ops')
  })

  it('takes its own limit from the caller, because a cell and a card have different room', () => {
    const { container } = render(<TagGroup items={['Design', 'Research', 'Delivery']} max={1} />)
    expect(screen.getByText('Design')).toBeInTheDocument()
    expect(screen.queryByText('Research')).not.toBeInTheDocument()
    expect(container.querySelector('.tag-group-more')?.textContent).toContain('Research, Delivery')
  })
})
