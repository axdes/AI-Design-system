import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CommandPalette, type Command } from './CommandPalette'

function makeCommands(onNew: () => void, onSettings: () => void): Command[] {
  return [
    { id: 'new', label: 'New document', keywords: 'create file', onRun: onNew },
    { id: 'settings', label: 'Open settings', keywords: 'preferences', onRun: onSettings },
  ]
}

describe('CommandPalette', () => {
  it('renders nothing when closed', () => {
    render(<CommandPalette open={false} onClose={() => undefined} commands={[]} />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('filters commands by query and runs the match on Enter', async () => {
    const user = userEvent.setup()
    const onNew = vi.fn()
    const onSettings = vi.fn()
    const onClose = vi.fn()
    render(<CommandPalette open onClose={onClose} commands={makeCommands(onNew, onSettings)} />)
    const input = screen.getByRole('combobox', { name: 'Search commands' })
    expect(input).toHaveFocus()
    await user.keyboard('preferences')
    /* Only the settings command matches its keyword. */
    expect(screen.getAllByRole('option')).toHaveLength(1)
    await user.keyboard('{Enter}')
    expect(onSettings).toHaveBeenCalledTimes(1)
    expect(onNew).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('shows the empty label when nothing matches', async () => {
    const user = userEvent.setup()
    render(<CommandPalette open onClose={() => undefined} commands={makeCommands(() => undefined, () => undefined)} emptyLabel="No results" />)
    await user.keyboard('zzz')
    expect(screen.queryByRole('option')).toBeNull()
    expect(screen.getByText('No results')).toBeInTheDocument()
  })

  it('moves the active option with the arrow keys', async () => {
    const user = userEvent.setup()
    render(<CommandPalette open onClose={() => undefined} commands={makeCommands(() => undefined, () => undefined)} />)
    const options = screen.getAllByRole('option')
    expect(options[0]).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{ArrowDown}')
    expect(screen.getAllByRole('option')[1]).toHaveAttribute('aria-selected', 'true')
  })

  it('closes on Escape', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<CommandPalette open onClose={onClose} commands={makeCommands(() => undefined, () => undefined)} />)
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
