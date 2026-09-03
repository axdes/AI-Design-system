import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PageHeader } from './PageHeader'

/* The top of every screen. Its one hard rule is about the leading corner: a
 * screen shows "back" when there is somewhere to go back to, and the drawer
 * trigger when there is not. Both at once is two ways out fighting over one
 * corner, which is what this component was written to stop. */

describe('PageHeader', () => {
  it('names the page with the only h1 on it', () => {
    render(<PageHeader title="Sessions" />)
    expect(screen.getByRole('heading', { level: 1, name: 'Sessions' })).toBeInTheDocument()
  })

  it('offers a way back when there is one', async () => {
    const onBack = vi.fn()
    render(<PageHeader title="Session detail" onBack={onBack} backLabel="Back to sessions" />)
    await userEvent.click(screen.getByRole('button', { name: 'Back to sessions' }))
    expect(onBack).toHaveBeenCalledOnce()
  })

  /* The trail says where you are; the back button says where you came from.
   * Showing both puts two answers to one question in the same corner. */
  it('drops the trail when there is a back button, because they say the same thing', () => {
    const { container, rerender } = render(
      <PageHeader title="Session detail" breadcrumb={<nav aria-label="Breadcrumb">Sessions</nav>} />,
    )
    expect(container.querySelector('.page-header-trail')).toBeInTheDocument()

    rerender(
      <PageHeader title="Session detail" onBack={vi.fn()} breadcrumb={<nav aria-label="Breadcrumb">Sessions</nav>} />,
    )
    expect(container.querySelector('.page-header-trail')).toBeNull()
  })

  it('carries the page actions it was given', () => {
    render(<PageHeader title="Sessions" actions={<button>New session</button>} />)
    expect(screen.getByRole('button', { name: 'New session' })).toBeInTheDocument()
  })
})
