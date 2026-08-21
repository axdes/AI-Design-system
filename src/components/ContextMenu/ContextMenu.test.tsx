import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ContextMenu, type ContextMenuItem } from './ContextMenu'

function makeItems(onRename: () => void, onDelete: () => void): ContextMenuItem[] {
  return [
    { id: 'rename', label: 'Rename', icon: 'edit', onSelect: onRename },
    { id: 'delete', label: 'Delete', icon: 'delete', tone: 'destructive', onSelect: onDelete },
  ]
}

describe('ContextMenu', () => {
  it('opens at the pointer on right-click and lists the items', () => {
    render(<ContextMenu items={makeItems(() => undefined, () => undefined)}><div>Row</div></ContextMenu>)
    expect(screen.queryByRole('menu')).toBeNull()
    fireEvent.contextMenu(screen.getByText('Row'), { clientX: 40, clientY: 40 })
    expect(screen.getByRole('menu', { name: 'Context menu' })).toBeInTheDocument()
    expect(screen.getAllByRole('menuitem')).toHaveLength(2)
  })

  it('runs a clicked item and closes', async () => {
    const user = userEvent.setup()
    const onRename = vi.fn()
    render(<ContextMenu items={makeItems(onRename, () => undefined)}><div>Row</div></ContextMenu>)
    fireEvent.contextMenu(screen.getByText('Row'), { clientX: 40, clientY: 40 })
    await user.click(screen.getByRole('menuitem', { name: /Rename/ }))
    expect(onRename).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('runs the active item with the keyboard and closes on Escape', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    render(<ContextMenu items={makeItems(() => undefined, onDelete)}><div>Row</div></ContextMenu>)
    fireEvent.contextMenu(screen.getByText('Row'), { clientX: 40, clientY: 40 })
    /* Down to the second item, Enter runs it. */
    await user.keyboard('{ArrowDown}{Enter}')
    expect(onDelete).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('closes on Escape without selecting', async () => {
    const user = userEvent.setup()
    const onRename = vi.fn()
    render(<ContextMenu items={makeItems(onRename, () => undefined)}><div>Row</div></ContextMenu>)
    fireEvent.contextMenu(screen.getByText('Row'), { clientX: 40, clientY: 40 })
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).toBeNull()
    expect(onRename).not.toHaveBeenCalled()
  })
})
