import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MenuIconButton } from './MenuIconButton'
import { DropdownItem } from '../Dropdown'

const ITEMS = <DropdownItem onClick={() => undefined}>Rename</DropdownItem>

describe('MenuIconButton', () => {
  /* The reason this is a component and not a MenuButton with an optional label:
     the name cannot be forgotten, because the type will not compile without it. */
  it('carries its label as the accessible name', () => {
    render(<MenuIconButton label="Actions for March">{ITEMS}</MenuIconButton>)
    expect(screen.getByRole('button', { name: 'Actions for March' })).toBeInTheDocument()
  })

  it('opens the menu', async () => {
    render(<MenuIconButton label="Actions for March">{ITEMS}</MenuIconButton>)
    await userEvent.click(screen.getByRole('button', { name: 'Actions for March' }))
    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Rename' })).toBeInTheDocument()
  })

  /* `align` decides which EDGE the menu lines up with, which is a computed
     position rather than an attribute — so the test gives the trigger a real box
     and reads the two answers apart. A control at the right of a row opens
     `end`; one at the left opens `start`, into the page rather than off it. */
  it('opens its menu from the edge the caller names', async () => {
    const user = userEvent.setup()
    const box = { top: 100, bottom: 140, left: 500, right: 540, width: 40, height: 40 }
    const openWith = async (align: 'start' | 'end') => {
      const { unmount } = render(
        <MenuIconButton label="Row actions" align={align}>
          <DropdownItem onClick={() => undefined}>Rename</DropdownItem>
        </MenuIconButton>,
      )
      const trigger = screen.getByRole('button', { name: 'Row actions' })
      trigger.getBoundingClientRect = () => ({ ...box, x: box.left, y: box.top, toJSON: () => box }) as DOMRect
      await user.click(trigger)
      const menu = document.querySelector('.dropdown-menu') as HTMLElement
      const style = { left: menu.style.left, right: menu.style.right }
      unmount()
      return style
    }
    expect(await openWith('start')).not.toEqual(await openWith('end'))
  })
})
