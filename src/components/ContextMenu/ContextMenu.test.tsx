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

  /* THE END OF THE LIST IS A WALL, NOT A CLIFF. ArrowDown clamps to the last
     item; one past it leaves `items[active]` undefined, so the highlight
     disappears and Enter does nothing on a menu that still looks open. A
     mutation run widened the clamp and nothing failed (2026-08-29). */
  it('ArrowDown stops on the last item and Enter still runs it', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    render(<ContextMenu items={makeItems(() => undefined, onDelete)}><div>Row</div></ContextMenu>)
    fireEvent.contextMenu(screen.getByText('Row'), { clientX: 40, clientY: 40 })

    /* Three presses on a two-item menu: the third must change nothing. */
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}')

    const menu = screen.getByRole('menu')
    const last = screen.getByRole('menuitem', { name: /Delete/ })
    expect(menu).toHaveAttribute('aria-activedescendant', last.id)

    await user.keyboard('{Enter}')
    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  /* SPACE RUNS THE ACTIVE ITEM, and never a disabled one. Enter, Space and a
     click are one code path now; before they were three, and a mutation that
     widened the disabled guard on one of them survived because the other two's
     tests still passed (2026-08-31). */
  it('Space runs the active item, and never a disabled one', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    const onRename = vi.fn()
    const items: ContextMenuItem[] = [
      { id: 'delete', label: 'Delete', onSelect: onDelete, disabled: true },
      { id: 'rename', label: 'Rename', onSelect: onRename },
    ]
    render(<ContextMenu items={items}><div>Row</div></ContextMenu>)
    fireEvent.contextMenu(screen.getByText('Row'), { clientX: 40, clientY: 40 })

    await user.keyboard(' ')
    expect(onDelete).not.toHaveBeenCalled()

    await user.keyboard('{ArrowDown} ')
    expect(onRename).toHaveBeenCalledTimes(1)
  })

  /* AND TO THE POINTER. `selectActive` guards on `item && !item.disabled`; widened to
     OR, a click runs an action the menu is showing as unavailable. The keyboard
     path below has its own guard and its own test, and until the two were
     separated (2026-08-31, when Enter moved into the shared list navigation)
     one test happened to cover both. It does not any more. */
  it('a click does not run a disabled item', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    const items: ContextMenuItem[] = [
      { id: 'delete', label: 'Delete', onSelect: onDelete, disabled: true },
      { id: 'rename', label: 'Rename', onSelect: () => undefined },
    ]
    render(<ContextMenu items={items}><div>Row</div></ContextMenu>)
    fireEvent.contextMenu(screen.getByText('Row'), { clientX: 40, clientY: 40 })

    await user.click(screen.getByRole('menuitem', { name: 'Delete' }))

    expect(onDelete).not.toHaveBeenCalled()
    expect(screen.getByRole('menu')).toBeInTheDocument()
  })

  /* A DISABLED ITEM IS DISABLED ON THE KEYBOARD TOO. The Enter branch guards on
     `item && !item.disabled`; widened to OR it fires for a disabled item, so an
     action the pointer cannot reach runs from the keyboard. A mutation run
     widened it and nothing failed (2026-08-29). */
  it('Enter does not run a disabled item', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    const items: ContextMenuItem[] = [
      { id: 'delete', label: 'Delete', onSelect: onDelete, disabled: true },
      { id: 'rename', label: 'Rename', onSelect: () => undefined },
    ]
    render(<ContextMenu items={items}><div>Row</div></ContextMenu>)
    fireEvent.contextMenu(screen.getByText('Row'), { clientX: 40, clientY: 40 })

    /* active starts at the first item, which is the disabled one. */
    await user.keyboard('{Enter}')

    expect(onDelete).not.toHaveBeenCalled()
    expect(screen.getByRole('menu')).toBeInTheDocument() // and it did not close
  })
})
