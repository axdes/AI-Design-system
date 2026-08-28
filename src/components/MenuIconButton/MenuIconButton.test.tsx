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
})
