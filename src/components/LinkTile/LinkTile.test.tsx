import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LinkTile } from './LinkTile'
import { DropdownItem } from '../Dropdown'

/* A tile is a link that contains a menu, which is the awkward part: every click
 * inside the menu is also a click on the link. These tests exist because the two
 * copies this component replaced each got that wrong in a different way. */

const Tile = ({ onOpen = () => undefined, onRename = () => undefined }) => (
  <LinkTile
    title="Quarterly review"
    menuLabel="Tile actions"
    onOpen={onOpen}
    menu={<DropdownItem onClick={onRename}>Rename</DropdownItem>}
  >
    <p>3 participants</p>
  </LinkTile>
)

describe('LinkTile', () => {
  it('opens on click', async () => {
    const onOpen = vi.fn()
    const user = userEvent.setup()
    render(<Tile onOpen={onOpen} />)

    await user.click(screen.getByRole('heading', { name: 'Quarterly review' }))
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('opens on Enter and on Space, like a real link', async () => {
    const onOpen = vi.fn()
    const user = userEvent.setup()
    render(<Tile onOpen={onOpen} />)

    const tile = screen.getByRole('link')
    tile.focus()
    await user.keyboard('{Enter}')
    await user.keyboard(' ')

    expect(onOpen).toHaveBeenCalledTimes(2)
  })

  it('is reachable by keyboard', async () => {
    const user = userEvent.setup()
    render(<Tile />)

    await user.tab()
    expect(screen.getByRole('link')).toHaveFocus()
  })

  it('does not navigate when the overflow menu is opened', async () => {
    const onOpen = vi.fn()
    const user = userEvent.setup()
    render(<Tile onOpen={onOpen} />)

    await user.click(screen.getByRole('button', { name: 'Tile actions' }))

    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(onOpen).not.toHaveBeenCalled()
  })

  it('does not navigate when a menu item is chosen', async () => {
    const onOpen = vi.fn()
    const onRename = vi.fn()
    const user = userEvent.setup()
    render(<Tile onOpen={onOpen} onRename={onRename} />)

    await user.click(screen.getByRole('button', { name: 'Tile actions' }))
    await user.click(screen.getByRole('menuitem', { name: 'Rename' }))

    expect(onRename).toHaveBeenCalledTimes(1)
    expect(onOpen).not.toHaveBeenCalled()
  })

  it('does not navigate when the menu is driven from the keyboard', async () => {
    const onOpen = vi.fn()
    const user = userEvent.setup()
    render(<Tile onOpen={onOpen} />)

    const trigger = screen.getByRole('button', { name: 'Tile actions' })
    trigger.focus()
    /* Space and Enter on the trigger must not reach the tile's own key handler. */
    await user.keyboard('{Enter}')

    expect(onOpen).not.toHaveBeenCalled()
  })
})
