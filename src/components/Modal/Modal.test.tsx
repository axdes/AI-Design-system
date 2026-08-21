import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal } from './Modal'
import { Button } from '../Button'

/* Modal promises four things no consumer should reimplement: a labelled dialog,
 * Escape-to-close, a focus trap, and a body scroll lock that survives stacking. */
function Dialog({ onClose = () => undefined, dismissible = true }) {
  return (
    <Modal open onClose={onClose} title="Rename document" dismissible={dismissible} footer={<Button>Save</Button>}>
      <Button>First</Button>
    </Modal>
  )
}

describe('Modal', () => {
  it('renders a labelled modal dialog', () => {
    render(<Dialog />)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAccessibleName('Rename document')
  })

  it('closes on Escape, and does not when dismissible is false', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const { unmount } = render(<Dialog onClose={onClose} />)

    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
    unmount()

    const onCloseLocked = vi.fn()
    render(<Dialog onClose={onCloseLocked} dismissible={false} />)
    await user.keyboard('{Escape}')
    expect(onCloseLocked).not.toHaveBeenCalled()
  })

  it('traps Tab inside the dialog', async () => {
    const user = userEvent.setup()
    render(<Dialog />)
    const focusables = screen.getAllByRole('button')
    const last = focusables[focusables.length - 1]

    last.focus()
    await user.tab()

    /* Wrapped back to the first control instead of escaping to the page. */
    expect(focusables[0]).toHaveFocus()
  })

  it('locks body scroll while open and restores it on close', () => {
    const { unmount } = render(<Dialog />)
    expect(document.body.style.overflow).toBe('hidden')

    /* Stacked modals share ONE lock: closing the inner one must not unlock. */
    const inner = render(<Dialog />)
    inner.unmount()
    expect(document.body.style.overflow).toBe('hidden')

    unmount()
    expect(document.body.style.overflow).toBe('')
  })

  it('returns focus to whatever was focused before it opened', () => {
    const opener = document.createElement('button')
    document.body.append(opener)
    opener.focus()

    const { unmount } = render(<Dialog />)
    expect(opener).not.toHaveFocus() // focus moved into the dialog
    unmount()

    expect(opener).toHaveFocus()
    opener.remove()
  })

  it('renders nothing when closed', () => {
    render(<Modal open={false} onClose={() => undefined} title="Hidden">Body</Modal>)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('opens on the field the content marks, not on the close button', async () => {
    /* Document order puts the header's close button first, so before this the
     * first thing a screen reader announced inside a form dialog was the way out
     * of it, and the first keystroke went nowhere. A dialog says where it opens
     * with `data-autofocus` (or the React `autoFocus` prop). */
    render(
      <Modal open onClose={() => undefined} title="Rename">
        <input aria-label="Name" data-autofocus defaultValue="Kickoff" />
      </Modal>,
    )
    expect(screen.getByLabelText('Name')).toHaveFocus()
  })

  it('opens on the content even when it asks for nothing', () => {
    /* The close button is first in DOCUMENT order, which used to make it the
     * fallback. That put a focus ring on the way out of every dialog that had
     * not opted in, so the search now starts at the body. */
    render(
      <Modal open onClose={() => undefined} title="Plain">
        <button type="button">Only action</button>
      </Modal>,
    )
    expect(screen.getByRole('button', { name: 'Only action' })).toHaveFocus()
  })

  it('falls back to the footer, then to the dialog, never to Close', () => {
    const { rerender } = render(
      <Modal open onClose={() => undefined} title="Footer only" footer={<button type="button">Save</button>}>
        <p>Nothing to focus in here.</p>
      </Modal>,
    )
    expect(screen.getByRole('button', { name: 'Save' })).toHaveFocus()

    /* No control anywhere: focus lands on the dialog itself, so the title is
     * announced and focus is still inside the trap. */
    rerender(
      <Modal open={false} onClose={() => undefined} title="Bare">
        <p>Nothing at all.</p>
      </Modal>,
    )
    rerender(
      <Modal open onClose={() => undefined} title="Bare" dismissible={false}>
        <p>Nothing at all.</p>
      </Modal>,
    )
    expect(screen.getByRole('dialog')).toHaveFocus()
  })

  it('traps Tab inside the dialog, in both directions', async () => {
    /* The whole point of a modal: focus cannot walk out into the page behind it.
     * Nothing tested this, which means the trap could have been deleted and every
     * other assertion here would still pass. */
    const user = userEvent.setup()
    render(
      <>
        <button type="button">Behind</button>
        <Modal open onClose={() => undefined} title="Rename" footer={<button type="button">Save</button>}>
          <input aria-label="Name" data-autofocus />
        </Modal>
      </>,
    )
    const close = screen.getByRole('button', { name: 'Close' })
    const save = screen.getByRole('button', { name: 'Save' })
    expect(screen.getByLabelText('Name')).toHaveFocus()

    /* Forward from the last focusable wraps to the first, not to "Behind". */
    save.focus()
    await user.tab()
    expect(close).toHaveFocus()

    /* And backward from the first wraps to the last. */
    await user.tab({ shift: true })
    expect(save).toHaveFocus()
  })

  it('a click on the overlay closes it, a click inside does not', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const { container } = render(
      <Modal open onClose={onClose} title="Rename">
        <p>Body</p>
      </Modal>,
    )

    await user.click(screen.getByText('Body'))
    expect(onClose).not.toHaveBeenCalled()

    /* mousedown on the overlay ITSELF, not on a child that bubbles through it. */
    await user.click(container.ownerDocument.querySelector('.modal-overlay')!)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('a non-dismissible dialog ignores the overlay and Escape', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const { container } = render(
      <Modal open onClose={onClose} title="Working" dismissible={false}>
        <p>Body</p>
      </Modal>,
    )

    await user.click(container.ownerDocument.querySelector('.modal-overlay')!)
    await user.keyboard('{Escape}')

    expect(onClose).not.toHaveBeenCalled()
  })

  it('returns focus to whatever opened it', async () => {
    const user = userEvent.setup()
    function Host() {
      const [open, setOpen] = useState(false)
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>Open</button>
          <Modal open={open} onClose={() => setOpen(false)} title="Rename">
            <p>Body</p>
          </Modal>
        </>
      )
    }
    render(<Host />)
    const opener = screen.getByRole('button', { name: 'Open' })
    await user.click(opener)
    await user.keyboard('{Escape}')

    expect(opener).toHaveFocus()
  })
})
