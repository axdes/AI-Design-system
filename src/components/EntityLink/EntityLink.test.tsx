import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EntityLink } from './EntityLink'

/* A link to a thing rather than to a page: the title is the name of the entity
 * and the extras around it are decoration until the view says otherwise. */

describe('EntityLink', () => {
  it('is a real link, named by the entity', () => {
    render(<EntityLink title="Northwind onboarding" href="/projects/1" />)
    expect(screen.getByRole('link', { name: 'Northwind onboarding' })).toHaveAttribute('href', '/projects/1')
  })

  /* Meta belongs to the card view, where there is room for a second line.
   * Inline, it would put a second sentence inside a link's accessible name. */
  it('shows its meta line as a card and hides it inline', () => {
    const { rerender } = render(<EntityLink title="Northwind" href="/p/1" view="card" meta="Updated today" />)
    expect(screen.getByText('Updated today')).toBeInTheDocument()

    rerender(<EntityLink title="Northwind" href="/p/1" meta="Updated today" />)
    expect(screen.queryByText('Updated today')).not.toBeInTheDocument()
  })

  it('carries a status beside the name without swallowing it', () => {
    render(<EntityLink title="Northwind" href="/p/1" status={<span>Active</span>} />)
    expect(screen.getByRole('link').textContent).toContain('Northwind')
    expect(screen.getByText('Active')).toBeInTheDocument()
  })
})
