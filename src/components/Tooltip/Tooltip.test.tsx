import { describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Tooltip } from './Tooltip'
import { IconButton } from '../IconButton'

/* Every icon-only control in this DS is wrapped in a Tooltip, so the tooltip has
 * to work for keyboard users too: it opens on focus, not just hover, and it
 * describes the trigger rather than naming it. */
describe('Tooltip', () => {
  it('appears on hover after the delay and describes the trigger', async () => {
    const user = userEvent.setup()
    render(
      <Tooltip content="Delete" delay={0}>
        <IconButton icon="delete" aria-label="Delete" />
      </Tooltip>,
    )
    const trigger = screen.getByRole('button', { name: 'Delete' })
    expect(screen.queryByRole('tooltip')).toBeNull()

    await user.hover(trigger)

    const tip = await screen.findByRole('tooltip')
    expect(tip).toHaveTextContent('Delete')
    expect(trigger).toHaveAttribute('aria-describedby', tip.id)

    await user.unhover(trigger)
    await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull())
  })

  it('appears on keyboard focus and hides on blur', async () => {
    const user = userEvent.setup()
    render(
      <>
        <Tooltip content="Delete" delay={0}>
          <IconButton icon="delete" aria-label="Delete" />
        </Tooltip>
        <button type="button">Next</button>
      </>,
    )

    await user.tab()
    expect(await screen.findByRole('tooltip')).toBeInTheDocument()

    await user.tab()
    await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull())
  })

  it('renders the child untouched when disabled', async () => {
    const user = userEvent.setup()
    render(
      <Tooltip content="Delete" delay={0} enabled={false}>
        <IconButton icon="delete" aria-label="Delete" />
      </Tooltip>,
    )
    const trigger = screen.getByRole('button', { name: 'Delete' })

    await user.hover(trigger)

    expect(screen.queryByRole('tooltip')).toBeNull()
    expect(trigger).not.toHaveAttribute('aria-describedby')
  })

  /* A trigger that goes disabled under the pointer never reports the pointer leaving: the browser
   * stops dispatching mouse events to a disabled control, so onMouseLeave never arrives. Reported
   * 2026-08-19 with two tooltips stranded on screen at once, over a task list whose checkboxes
   * disable themselves while the change saves - which is the ordinary shape of a button that does
   * work: press, disable, re-enable. */
  it('lets go when the trigger becomes disabled under the pointer', async () => {
    function Saving() {
      const [busy, setBusy] = useState(false)
      return (
        <Tooltip content="Put this back" delay={0}>
          <button type="button" disabled={busy} onClick={() => setBusy(true)}>Tick</button>
        </Tooltip>
      )
    }
    render(<Saving />)
    const btn = screen.getByRole('button', { name: 'Tick' })
    fireEvent.mouseEnter(btn)
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Put this back')

    /* The click disables the button. No mouseLeave follows, exactly as in a browser. */
    fireEvent.click(btn)
    await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument())
  })

  it('dismisses on press, the way every desktop tooltip does', async () => {
    render(
      <Tooltip content="Mark as sorted" delay={0}>
        <button type="button">Tick</button>
      </Tooltip>,
    )
    const btn = screen.getByRole('button')
    fireEvent.mouseEnter(btn)
    expect(await screen.findByRole('tooltip')).toBeInTheDocument()
    fireEvent.pointerDown(btn)
    await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument())
  })

  it('still calls the trigger own handlers', async () => {
    const onPointerDown = vi.fn()
    render(
      <Tooltip content="x" delay={0}>
        <button type="button" onPointerDown={onPointerDown}>Tick</button>
      </Tooltip>,
    )
    fireEvent.pointerDown(screen.getByRole('button'))
    expect(onPointerDown).toHaveBeenCalledTimes(1)
  })
})
