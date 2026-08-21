import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Alert } from './Alert'

/* The close button only exists when the consumer passes a handler: an alert that
 * could be dismissed but is not wired to anything looks closable and is not. */

describe('Alert', () => {
  it('has no close button without onDismiss', () => {
    render(<Alert tone="warning">Your trial ends on Friday.</Alert>)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('calls onDismiss when the close button is used', async () => {
    const onDismiss = vi.fn()
    const user = userEvent.setup()
    render(<Alert tone="info" onDismiss={onDismiss}>Drafts save automatically.</Alert>)

    await user.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('closes from the keyboard', async () => {
    const onDismiss = vi.fn()
    const user = userEvent.setup()
    render(<Alert tone="success" onDismiss={onDismiss}>Invite sent.</Alert>)

    await user.tab()
    expect(screen.getByRole('button', { name: 'Dismiss' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('keeps the action and the close button apart', () => {
    render(
      <Alert tone="danger" role="alert" action={<button type="button">Retry</button>} onDismiss={() => undefined}>
        Upload failed.
      </Alert>,
    )

    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument()
  })

  it('carries the tone as a data attribute', () => {
    const { container } = render(<Alert tone="neutral">Read-only view.</Alert>)
    expect(container.querySelector('.alert')).toHaveAttribute('data-tone', 'neutral')
  })
})
