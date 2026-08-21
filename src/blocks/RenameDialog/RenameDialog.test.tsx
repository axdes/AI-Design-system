import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { RenameDialog } from './RenameDialog'
import { Button } from '../../components/Button'

/* What this block promises beyond "a modal with a field": the two no-op cases
 * (empty, unchanged) never reach the caller, and the field re-seeds when a
 * different row opens the same dialog. That last one is where the hand-written
 * copies used an effect that assigned state on open. */
describe('RenameDialog', () => {
  const setup = (onSave = vi.fn()) => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <RenameDialog
        open
        title="Rename recording"
        label="Name"
        initial="Kickoff call"
        onClose={onClose}
        onSave={onSave}
      />,
    )
    return { user, onSave, onClose, field: screen.getByLabelText('Name') }
  }

  it('opens seeded with the current name, selected so typing replaces it', () => {
    const { field } = setup()
    expect(field).toHaveValue('Kickoff call')
    expect(field).toHaveFocus()
    expect((field as HTMLInputElement).selectionStart).toBe(0)
    expect((field as HTMLInputElement).selectionEnd).toBe('Kickoff call'.length)
  })

  it('saves a new name, trimmed', async () => {
    const { user, onSave, field } = setup()
    await user.clear(field)
    await user.type(field, '  Client intake  ')
    await user.click(screen.getByRole('button', { name: 'Rename' }))

    expect(onSave).toHaveBeenCalledWith('Client intake')
  })

  it('Enter saves without reaching for the button', async () => {
    const { user, onSave, field } = setup()
    await user.clear(field)
    await user.type(field, 'Client intake{Enter}')

    expect(onSave).toHaveBeenCalledWith('Client intake')
  })

  it('an unchanged name closes without calling onSave', async () => {
    const { user, onSave, onClose } = setup()
    await user.click(screen.getByRole('button', { name: 'Rename' }))

    expect(onSave).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it('an empty name cannot be submitted', async () => {
    const { user, onSave, field } = setup()
    await user.clear(field)

    expect(screen.getByRole('button', { name: 'Rename' })).toBeDisabled()
    await user.type(field, '   {Enter}')
    expect(onSave).not.toHaveBeenCalled()
  })

  it('re-seeds when a different row opens the same dialog', async () => {
    /* The reason the body is keyed rather than assigned in an effect: the second
     * row must not open showing the first row's name, and doing that with an
     * effect is a cascading render the compiler rules flag. */
    function Host() {
      const [name, setName] = useState('First')
      const [open, setOpen] = useState(false)
      return (
        <>
          <Button onClick={() => { setName('First'); setOpen(true) }}>Open first</Button>
          <Button onClick={() => { setName('Second'); setOpen(true) }}>Open second</Button>
          <RenameDialog
            open={open}
            title="Rename"
            label="Name"
            initial={name}
            onClose={() => setOpen(false)}
            onSave={() => setOpen(false)}
          />
        </>
      )
    }
    const user = userEvent.setup()
    render(<Host />)

    await user.click(screen.getByRole('button', { name: 'Open first' }))
    expect(screen.getByLabelText('Name')).toHaveValue('First')
    await user.keyboard('{Escape}')

    await user.click(screen.getByRole('button', { name: 'Open second' }))
    expect(screen.getByLabelText('Name')).toHaveValue('Second')
  })
})
