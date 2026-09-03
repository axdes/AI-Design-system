import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ButtonGroup } from './ButtonGroup'
import { Button } from '../Button'
import { DropdownItem } from '../Dropdown'

const MENU = <DropdownItem onClick={() => undefined}>Save a copy</DropdownItem>

/* The three forms differ in ONE thing that matters: how many targets the pointer
 * and the keyboard see, and which of them opens the menu. Everything else is
 * arrangement. */
describe('ButtonGroup', () => {
  it('is one target when no half is promoted', async () => {
    render(<ButtonGroup label="Create" menu={MENU} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(1)
    expect(buttons[0]).toHaveAttribute('aria-haspopup', 'menu')
    /* And no group: a container announced around a single control is furniture
       a screen reader has to walk past for nothing. */
    expect(screen.queryByRole('group')).toBeNull()
    await userEvent.click(buttons[0])
    expect(screen.getByRole('menu')).toBeInTheDocument()
  })

  it('splits into two targets when a half is given', async () => {
    const onClick = vi.fn()
    render(
      <ButtonGroup label="Save options" menuLabel="Other ways to save" menu={MENU}>
        <Button onClick={onClick}>Save</Button>
      </ButtonGroup>,
    )
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
    render(
      <ButtonGroup label="Publish options" menu={MENU}>
        <Button onClick={() => undefined}>Publish</Button>
      </ButtonGroup>,
    )
    expect(screen.getByRole('button', { name: 'Publish options' })).toBeInTheDocument()
  })

  it('announces the parts as one group, under the label', () => {
    render(
      <ButtonGroup label="Export options">
        <Button onClick={() => undefined}>CSV</Button>
        <Button onClick={() => undefined}>PDF</Button>
      </ButtonGroup>,
    )
    const group = screen.getByRole('group', { name: 'Export options' })
    expect(group).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(2)
  })

  /* One prop paints every fill, which is the whole reason the two components
     became one: a split primary action can no longer be told `primary` on the
     button and something else on the seam. */
  it('carries the variant through to the seam and the chevron', () => {
    const { container } = render(
      <ButtonGroup label="Save options" variant="primary" menu={MENU}>
        <Button onClick={() => undefined}>Save</Button>
      </ButtonGroup>,
    )
    expect(container.querySelector('.button-group')).toHaveAttribute('data-variant', 'primary')
    expect(screen.getByRole('button', { name: 'Save options' })).toHaveAttribute('data-tone', 'primary')
  })
})
