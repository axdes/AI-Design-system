import { describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Popover } from './Popover'
import { Button } from '../Button'

function Host() {
  return (
    <Popover label="Filters" trigger={(props) => <Button {...props}>Open</Button>}>
      <button type="button">Inside</button>
    </Popover>
  )
}

describe('Popover', () => {
  it('wires the trigger to a labelled dialog and toggles it', async () => {
    const user = userEvent.setup()
    render(<Host />)
    const trigger = screen.getByRole('button', { name: 'Open' })
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('dialog')).toBeNull()

    await user.click(trigger)
    const dialog = screen.getByRole('dialog', { name: 'Filters' })
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(trigger).toHaveAttribute('aria-controls', dialog.id)
  })

  it('closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup()
    render(<Host />)
    const trigger = screen.getByRole('button', { name: 'Open' })
    await user.click(trigger)
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(trigger).toHaveFocus()
  })

  it('closes on an outside click but not on an inside one', async () => {
    const user = userEvent.setup()
    render(
      <>
        <Host />
        <button type="button">Outside</button>
      </>,
    )
    await user.click(screen.getByRole('button', { name: 'Open' }))
    await user.click(screen.getByRole('button', { name: 'Inside' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Outside' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })
})
