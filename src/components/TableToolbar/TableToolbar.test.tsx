import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TableToolbar } from './TableToolbar'

/* The strip over a table. Its interesting half is the count: filtering shortens
 * the rows, and somebody who cannot see them shorten has no other way to know
 * it happened — so the number is a live region, politely. */

describe('TableToolbar', () => {
  it('announces the row count as it changes', () => {
    const { container, rerender } = render(<TableToolbar title="Sessions" count={12} />)
    const live = container.querySelector('.table-toolbar-count')
    expect(live).toHaveAttribute('aria-live', 'polite')
    expect(live?.textContent).toMatch(/12/)

    rerender(<TableToolbar title="Sessions" count={3} />)
    expect(container.querySelector('.table-toolbar-count')?.textContent).toMatch(/3/)
  })

  it('says nothing about a count nobody gave it', () => {
    const { container } = render(<TableToolbar title="Sessions" />)
    expect(container.querySelector('.table-toolbar-count')).toBeNull()
  })

  it('takes the heading level the page needs', () => {
    const { rerender } = render(<TableToolbar title="Sessions" />)
    expect(screen.getByRole('heading', { level: 3, name: 'Sessions' })).toBeInTheDocument()

    rerender(<TableToolbar title="Sessions" as="h2" />)
    expect(screen.getByRole('heading', { level: 2, name: 'Sessions' })).toBeInTheDocument()
  })

  /* When rows are selected the toolbar becomes the batch bar and nothing else:
   * a filter row beside "3 selected" invites filtering away the selection. */
  it('is the batch bar alone while a selection is live', () => {
    render(<TableToolbar title="Sessions" count={12} batch={<span>3 selected</span>} />)
    expect(screen.getByText('3 selected')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Sessions' })).not.toBeInTheDocument()
  })

  it('offers the density switch only when somebody can act on it', () => {
    const { rerender } = render(<TableToolbar title="Sessions" density="comfortable" />)
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()

    rerender(<TableToolbar title="Sessions" density="comfortable" onDensityChange={vi.fn()} />)
    expect(screen.getByRole('radiogroup')).toBeInTheDocument()
  })
})
