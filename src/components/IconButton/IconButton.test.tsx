import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef } from 'react'
import { IconButton } from './IconButton'

/* An icon-only control has no text, so everything a non-sighted user gets comes
 * from attributes: the label, the busy state, and the fact that a loading button
 * cannot be pressed twice. */

describe('IconButton', () => {
  it('is a non-submitting button unless asked otherwise', () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault())
    render(
      <form onSubmit={onSubmit}>
        <IconButton icon="delete" aria-label="Delete" />
      </form>,
    )
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveAttribute('type', 'button')
  })

  it('submits when the caller asks for it', () => {
    render(<IconButton icon="check" type="submit" aria-label="Save" />)
    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('type', 'submit')
  })

  it('while loading: announces busy, blocks the click, and keeps its name', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(<IconButton icon="send" loading aria-label="Send" onClick={onClick} />)

    const button = screen.getByRole('button', { name: 'Send', hidden: true })
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button).toBeDisabled()

    await user.click(button)
    expect(onClick).not.toHaveBeenCalled()

    /* The spinner reuses the button's own label. Falling back to a generic
     * "Loading" would announce four identical spinners on a toolbar. */
    expect(screen.getByRole('status', { hidden: true })).toHaveTextContent('Send')
  })

  it('is not busy when it is merely disabled', () => {
    render(<IconButton icon="send" disabled aria-label="Send" />)

    const button = screen.getByRole('button', { name: 'Send' })
    expect(button).toBeDisabled()
    expect(button).not.toHaveAttribute('aria-busy')
  })

  it('hands the caller a ref to the real button', () => {
    function Host() {
      const ref = useRef<HTMLButtonElement | null>(null)
      return (
        <>
          <IconButton ref={ref} icon="edit" aria-label="Edit" />
          <button onClick={() => ref.current?.focus()}>focus it</button>
        </>
      )
    }
    render(<Host />)
    screen.getByRole('button', { name: 'focus it' }).click()

    expect(screen.getByRole('button', { name: 'Edit' })).toHaveFocus()
  })

  it('fires on click and on Enter', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(<IconButton icon="edit" aria-label="Edit" onClick={onClick} />)

    const button = screen.getByRole('button', { name: 'Edit' })
    await user.click(button)
    button.focus()
    await user.keyboard('{Enter}')

    expect(onClick).toHaveBeenCalledTimes(2)
  })
})
