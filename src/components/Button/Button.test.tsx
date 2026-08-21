import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'
import { IconButton } from '../IconButton'

/* The loading state is the reason these got a test: a busy button must announce
 * itself and refuse a second click, or an async submit fires twice. */
describe('Button loading', () => {
  it('marks itself busy, blocks clicks, and keeps its label', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button loading loadingLabel="Saving" onClick={onClick}>Save</Button>)

    const button = screen.getByRole('button', { name: /Save/ })
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button).toBeDisabled()
    /* Label stays so the width does not jump; the spinner's live region carries
     * the busy text a screen reader reads out. */
    expect(button).toHaveTextContent('Save')
    expect(screen.getByRole('status')).toHaveTextContent('Saving')

    await user.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('is a normal, clickable button when not loading', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Save</Button>)

    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(onClick).toHaveBeenCalledOnce()
    expect(screen.queryByRole('status')).toBeNull()
  })
})

describe('IconButton loading', () => {
  it('swaps the icon for a spinner named by the button, and blocks clicks', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<IconButton icon="save" aria-label="Save" loading onClick={onClick} />)

    const button = screen.getByRole('button', { name: 'Save' })
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent('Save')

    await user.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })
})
