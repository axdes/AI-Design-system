import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MenuButton } from './MenuButton'
import { DropdownItem } from '../Dropdown'

const ITEMS = <DropdownItem onClick={() => undefined}>Save a copy</DropdownItem>

/* The two forms differ in ONE thing that matters: how many targets the pointer
 * and the keyboard see. Everything else is arrangement. */
describe('MenuButton', () => {
  it('is one target when nothing is promoted', async () => {
    render(<MenuButton label="Create">{ITEMS}</MenuButton>)
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(1)
    expect(buttons[0]).toHaveAttribute('aria-haspopup', 'menu')
    await userEvent.click(buttons[0])
    expect(screen.getByRole('menu')).toBeInTheDocument()
  })

  it('splits into two targets when a default action is given', async () => {
    const onClick = vi.fn()
    render(<MenuButton label="Save" menuLabel="Other ways to save" onClick={onClick}>{ITEMS}</MenuButton>)
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onClick).toHaveBeenCalledTimes(1)
    /* The commit must NOT open the menu: that is the whole point of promoting it. */
    expect(screen.queryByRole('menu')).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Other ways to save' }))
    expect(screen.getByRole('menu')).toBeInTheDocument()
  })

  /* The half that is only a chevron is the one an icon-only control loses its
     name on. It cannot be nameless, with or without menuLabel. */
  it('names the chevron half even when the caller forgets to', () => {
    render(<MenuButton label="Publish" onClick={() => undefined}>{ITEMS}</MenuButton>)
    expect(screen.getByRole('button', { name: 'Publish options' })).toBeInTheDocument()
  })

  it('announces the pair as one group', () => {
    render(<MenuButton label="Save" menuLabel="Other ways to save" onClick={() => undefined}>{ITEMS}</MenuButton>)
    expect(screen.getByRole('group', { name: 'Other ways to save' })).toBeInTheDocument()
  })
})
