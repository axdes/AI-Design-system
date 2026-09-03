import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BatchActions } from './BatchActions'
import { Button } from '../Button'

/* The bar that appears when rows are selected. Everything it does is about the
 * number: a person is about to act on rows they cannot all see, so the count is
 * said in the bar's own name, said again as a live region when it changes, and
 * there is always a way back to none. */

describe('BatchActions', () => {
  it('names itself by what is selected, so landing on it says how many', () => {
    render(<BatchActions count={3} onClear={vi.fn()}><Button>Archive</Button></BatchActions>)
    const bar = screen.getByRole('toolbar')
    expect(bar.getAttribute('aria-label')).toMatch(/3/)
  })

  it('announces the count as it changes, without moving focus', () => {
    const { container, rerender } = render(<BatchActions count={1} onClear={vi.fn()}><Button>Archive</Button></BatchActions>)
    const live = container.querySelector('.batch-actions-count')
    expect(live).toHaveAttribute('aria-live', 'polite')
    expect(live?.textContent).toMatch(/1/)

    rerender(<BatchActions count={12} onClear={vi.fn()}><Button>Archive</Button></BatchActions>)
    expect(container.querySelector('.batch-actions-count')?.textContent).toMatch(/12/)
  })

  it('always offers the way back to none', async () => {
    const onClear = vi.fn()
    render(<BatchActions count={3} onClear={onClear}><Button>Archive</Button></BatchActions>)
    await userEvent.click(screen.getByRole('button', { name: /clear/i }))
    expect(onClear).toHaveBeenCalledOnce()
  })

  it('carries the actions it was given', () => {
    render(<BatchActions count={2} onClear={vi.fn()}><Button>Archive</Button><Button>Delete</Button></BatchActions>)
    expect(screen.getByRole('button', { name: 'Archive' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
  })
})
