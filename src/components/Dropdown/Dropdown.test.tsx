import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Dropdown, DropdownDivider, DropdownItem, DropdownSection } from './Dropdown'
import { Button } from '../Button'

/* The keyboard contract is the reason this component exists instead of a bare
 * <ul>: menus in the DS are reachable and escapable without a mouse, and focus
 * always comes back to the trigger. */
function Menu({ onSelect = () => undefined, closeOnSelect = true }) {
  return (
    <Dropdown closeOnSelect={closeOnSelect} trigger={(props) => <Button {...props}>Actions</Button>}>
      <DropdownItem onClick={onSelect}>Rename</DropdownItem>
      <DropdownItem>Duplicate</DropdownItem>
      <DropdownItem>Delete</DropdownItem>
    </Dropdown>
  )
}

const items = () => screen.getAllByRole('menuitem')

describe('Dropdown', () => {
  it('wires the trigger to the menu with ARIA', async () => {
    const user = userEvent.setup()
    render(<Menu />)
    const trigger = screen.getByRole('button', { name: 'Actions' })

    expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('menu')).toBeNull()

    await user.click(trigger)

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const menu = screen.getByRole('menu')
    expect(menu).toHaveAttribute('aria-labelledby', trigger.id)
    expect(trigger).toHaveAttribute('aria-controls', menu.id)
  })

  it('focuses the first item on open and walks with Arrow/Home/End', async () => {
    const user = userEvent.setup()
    render(<Menu />)
    await user.click(screen.getByRole('button', { name: 'Actions' }))

    await waitFor(() => expect(items()[0]).toHaveFocus())

    await user.keyboard('{ArrowDown}')
    expect(items()[1]).toHaveFocus()
    await user.keyboard('{ArrowUp}')
    expect(items()[0]).toHaveFocus()
    await user.keyboard('{End}')
    expect(items()[2]).toHaveFocus()
    await user.keyboard('{Home}')
    expect(items()[0]).toHaveFocus()
    /* Ends clamp instead of wrapping — the menu is a list, not a carousel. */
    await user.keyboard('{ArrowUp}')
    expect(items()[0]).toHaveFocus()
  })

  it('closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup()
    render(<Menu />)
    const trigger = screen.getByRole('button', { name: 'Actions' })
    await user.click(trigger)
    await waitFor(() => expect(items()[0]).toHaveFocus())

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('menu')).toBeNull()
    expect(trigger).toHaveFocus()
  })

  it('closes on outside click', async () => {
    const user = userEvent.setup()
    render(<Menu />)
    await user.click(screen.getByRole('button', { name: 'Actions' }))
    expect(screen.getByRole('menu')).toBeInTheDocument()

    await user.click(document.body)

    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
  })

  it('runs the item handler and closes; closeOnSelect=false keeps it open', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const { unmount } = render(<Menu onSelect={onSelect} />)
    await user.click(screen.getByRole('button', { name: 'Actions' }))
    await user.click(screen.getByRole('menuitem', { name: 'Rename' }))

    expect(onSelect).toHaveBeenCalledOnce()
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
    unmount()

    render(<Menu closeOnSelect={false} />)
    await user.click(screen.getByRole('button', { name: 'Actions' }))
    await user.click(screen.getByRole('menuitem', { name: 'Rename' }))
    expect(screen.getByRole('menu')).toBeInTheDocument()
  })

  it('marks the current choice with aria-current, not a hand-rolled check', () => {
    render(<DropdownItem selected>Editor</DropdownItem>)
    expect(screen.getByRole('menuitem', { name: 'Editor' })).toHaveAttribute('aria-current', 'true')
  })

  /* Everything below was written from a mutation run: the tests above left 116
   * mutants alive, which is another way of saying most of this component's
   * contract was documented in comments and checked by nobody. */

  it('toggles shut when the trigger is clicked again', async () => {
    const user = userEvent.setup()
    render(<Menu />)
    const trigger = screen.getByRole('button', { name: 'Actions' })

    await user.click(trigger)
    expect(screen.getByRole('menu')).toBeInTheDocument()

    await user.click(trigger)
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('stays open when the click lands inside the menu but not on an item', async () => {
    const user = userEvent.setup()
    render(
      <Dropdown closeOnSelect={false} trigger={(props) => <Button {...props}>Actions</Button>}>
        <DropdownDivider />
        <DropdownItem>Rename</DropdownItem>
      </Dropdown>,
    )
    await user.click(screen.getByRole('button', { name: 'Actions' }))

    await user.click(screen.getByRole('separator'))

    expect(screen.getByRole('menu')).toBeInTheDocument()
  })

  it('Tab closes the menu WITHOUT stealing focus back to the trigger', async () => {
    /* The one close path that deliberately does not return focus: the user is
     * tabbing onward, and yanking them back to the trigger would trap them in a
     * loop between the two. */
    const user = userEvent.setup()
    render(
      <>
        <Menu />
        <Button>After</Button>
      </>,
    )
    const trigger = screen.getByRole('button', { name: 'Actions' })
    await user.click(trigger)
    await waitFor(() => expect(items()[0]).toHaveFocus())

    await user.tab()

    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
    expect(trigger).not.toHaveFocus()
  })

  it('ArrowDown stops at the last item instead of wrapping', async () => {
    const user = userEvent.setup()
    render(<Menu />)
    await user.click(screen.getByRole('button', { name: 'Actions' }))
    await waitFor(() => expect(items()[0]).toHaveFocus())

    await user.keyboard('{End}')
    await user.keyboard('{ArrowDown}')

    expect(items()[2]).toHaveFocus()
  })

  it('an unknown key does nothing at all', async () => {
    /* Guards the switch: a mutant that turns a case into a fall-through, or drops
     * the `break`, shows up here as focus moving on a key that should be inert. */
    const user = userEvent.setup()
    render(<Menu />)
    await user.click(screen.getByRole('button', { name: 'Actions' }))
    await waitFor(() => expect(items()[0]).toHaveFocus())

    await user.keyboard('{ArrowRight}')

    expect(items()[0]).toHaveFocus()
    expect(screen.getByRole('menu')).toBeInTheDocument()
  })

  it('opens the menu in a portal on <body>, not inside the trigger wrapper', async () => {
    /* The portal is why a menu is never clipped by an overflow:hidden ancestor.
     * A mutant that drops createPortal renders a menu that still passes every
     * ARIA assertion above and is invisible inside the first scrolling card. */
    const user = userEvent.setup()
    const { container } = render(<Menu />)
    await user.click(screen.getByRole('button', { name: 'Actions' }))

    const menu = screen.getByRole('menu')
    expect(menu.parentElement).toBe(document.body)
    expect(container.querySelector('[role="menu"]')).toBeNull()
  })

  it('marks the wrapper open so CSS can react, and clears it on close', async () => {
    const user = userEvent.setup()
    const { container } = render(<Menu />)
    const wrapper = container.querySelector('.dropdown')

    expect(wrapper).not.toHaveAttribute('data-open')
    await user.click(screen.getByRole('button', { name: 'Actions' }))
    expect(wrapper).toHaveAttribute('data-open')

    /* Escape has to reach the MENU's handler, and focus only lands on the first
       item a frame after open. Sending it earlier tests the document, not this. */
    await waitFor(() => expect(items()[0]).toHaveFocus())
    await user.keyboard('{Escape}')
    expect(wrapper).not.toHaveAttribute('data-open')
  })

  it('passes menuClassName to the portaled menu, where a parent selector cannot reach', async () => {
    const user = userEvent.setup()
    render(
      <Dropdown menuClassName="wide-menu" trigger={(props) => <Button {...props}>Actions</Button>}>
        <DropdownItem>Rename</DropdownItem>
      </Dropdown>,
    )
    await user.click(screen.getByRole('button', { name: 'Actions' }))

    const menu = screen.getByRole('menu')
    expect(menu).toHaveClass('dropdown-menu')
    expect(menu).toHaveClass('wide-menu')
  })

  it('places the menu from measured geometry on both axes', async () => {
    /* `position: fixed` is in Dropdown.css; what the component computes is the
       offsets. A mutant that returns an empty object leaves the menu at the
       document origin, and no ARIA assertion above notices. */
    const user = userEvent.setup()
    render(<Menu />)
    await user.click(screen.getByRole('button', { name: 'Actions' }))

    const menu = screen.getByRole('menu')
    expect(menu.style.top).not.toBe('')
    expect(menu.style.left === '' && menu.style.right === '').toBe(false)
  })

  it('matchTriggerWidth pins the menu to the trigger width', async () => {
    const user = userEvent.setup()
    render(
      <Dropdown matchTriggerWidth trigger={(props) => <Button {...props}>Actions</Button>}>
        <DropdownItem>Rename</DropdownItem>
      </Dropdown>,
    )
    await user.click(screen.getByRole('button', { name: 'Actions' }))

    /* jsdom measures every element as 0x0, so the assertion is that the option
     * reaches the placement maths at all — a fixed width is set, rather than the
     * intrinsic sizing the default gives. */
    expect(screen.getByRole('menu').style.width).not.toBe('')
  })

  it('an item is a real button of type=button, and renders its icon and check', () => {
    /* type defaults to "button" on purpose: a menu item inside a form would
     * otherwise submit it. */
    render(
      <>
        <DropdownItem icon="edit">Rename</DropdownItem>
        <DropdownItem selected>Editor</DropdownItem>
      </>,
    )
    const rename = screen.getByRole('menuitem', { name: 'Rename' })
    expect(rename).toHaveAttribute('type', 'button')
    expect(rename.querySelector('.icon')).not.toBeNull()

    const editor = screen.getByRole('menuitem', { name: 'Editor' })
    expect(editor).toHaveAttribute('data-selected')
    expect(editor.querySelector('.dropdown-item-check')).not.toBeNull()
  })

  it('an unselected item carries neither the marker nor the check', () => {
    render(<DropdownItem>Editor</DropdownItem>)
    const item = screen.getByRole('menuitem', { name: 'Editor' })
    expect(item).not.toHaveAttribute('aria-current')
    expect(item).not.toHaveAttribute('data-selected')
    expect(item.querySelector('.dropdown-item-check')).toBeNull()
  })

  it('the divider is a separator, not a decorative line', () => {
    render(<DropdownDivider />)
    expect(screen.getByRole('separator')).toHaveClass('dropdown-divider')
  })

  it('align defaults to the trailing edge, and start pins the other way', async () => {
    /* The default is not decorative: a `⋮` in a card's top-inline-end corner
     * opens a menu that must not hang off the card. A mutant that flips the
     * default sends every overflow menu the wrong way. */
    const user = userEvent.setup()
    const { unmount } = render(<Menu />)
    await user.click(screen.getByRole('button', { name: 'Actions' }))
    expect(screen.getByRole('menu').style.right).not.toBe('')
    unmount()

    render(
      <Dropdown align="start" trigger={(props) => <Button {...props}>Other</Button>}>
        <DropdownItem>Rename</DropdownItem>
      </Dropdown>,
    )
    await user.click(screen.getByRole('button', { name: 'Other' }))
    expect(screen.getByRole('menu').style.left).not.toBe('')
  })

  it('re-measures while open when the page scrolls or resizes', async () => {
    /* An open menu is `position: fixed` against numbers taken once. Without this
     * listener it stays put while the trigger scrolls away underneath it, which
     * looks like the menu belongs to whatever it happens to be over. */
    const user = userEvent.setup()
    render(<Menu />)
    const trigger = screen.getByRole('button', { name: 'Actions' })

    let top = 100
    const rect = () => ({ top, bottom: top + 20, left: 10, right: 60, width: 50, height: 20, x: 10, y: top, toJSON: () => ({}) })
    vi.spyOn(trigger, 'getBoundingClientRect').mockImplementation(() => rect() as DOMRect)

    await user.click(trigger)
    const menu = screen.getByRole('menu')
    const first = menu.style.top

    top = 400
    window.dispatchEvent(new Event('scroll'))
    await waitFor(() => expect(menu.style.top).not.toBe(first))

    const second = menu.style.top
    top = 200
    window.dispatchEvent(new Event('resize'))
    await waitFor(() => expect(menu.style.top).not.toBe(second))
  })

  it('re-measures when a SCROLLING CONTAINER moves, not just the window', async () => {
    /* Scroll events do not bubble, so a listener without `capture: true` never
     * hears a scroll inside a card or a side panel — which is where menus
     * actually live. The menu would sit still while its row scrolled away. */
    const user = userEvent.setup()
    const { container } = render(
      <div style={{ overflow: 'auto' }} data-testid="scroller">
        <Menu />
      </div>,
    )
    const trigger = screen.getByRole('button', { name: 'Actions' })
    let top = 100
    vi.spyOn(trigger, 'getBoundingClientRect').mockImplementation(
      () => ({ top, bottom: top + 20, left: 10, right: 60, width: 50, height: 20, x: 10, y: top, toJSON: () => ({}) }) as DOMRect,
    )

    await user.click(trigger)
    const menu = screen.getByRole('menu')
    const before = menu.style.top

    top = 500
    container.querySelector('[data-testid="scroller"]')!.dispatchEvent(new Event('scroll', { bubbles: false }))

    await waitFor(() => expect(menu.style.top).not.toBe(before))
  })

  it('lets go of its listeners when it unmounts while open', async () => {
    /* An open menu that is unmounted (a route change, a parent collapsing) leaves
     * two window listeners and a queued frame behind. They fire against a
     * component that no longer exists. */
    const user = userEvent.setup()
    const remove = vi.spyOn(window, 'removeEventListener')
    const { unmount } = render(<Menu />)
    await user.click(screen.getByRole('button', { name: 'Actions' }))

    unmount()

    const removed = remove.mock.calls.map((c) => c[0])
    expect(removed).toContain('scroll')
    expect(removed).toContain('resize')
    remove.mockRestore()
  })

  /* A disabled menu item is aria-disabled, not natively disabled, so it keeps
   * its place in the arrow-key order and stays hoverable for a tooltip. That
   * only works if the click is stopped in JS, including the bubble that would
   * otherwise close the menu. */
  it('does not act on a disabled item, and keeps the menu open', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(
      <Dropdown trigger={(props) => <Button {...props}>Actions</Button>}>
        <DropdownItem disabled onClick={onSelect}>Move</DropdownItem>
        <DropdownItem>Rename</DropdownItem>
      </Dropdown>,
    )
    await user.click(screen.getByRole('button', { name: 'Actions' }))

    const disabled = screen.getByRole('menuitem', { name: 'Move' })
    expect(disabled).toHaveAttribute('aria-disabled', 'true')
    expect(disabled).not.toHaveAttribute('disabled')

    await user.click(disabled)
    expect(onSelect).not.toHaveBeenCalled()
    expect(screen.getByRole('menu')).toBeInTheDocument()
  })

  it('keeps a disabled item in the arrow-key order', async () => {
    const user = userEvent.setup()
    render(
      <Dropdown trigger={(props) => <Button {...props}>Actions</Button>}>
        <DropdownItem disabled>Move</DropdownItem>
        <DropdownItem>Rename</DropdownItem>
      </Dropdown>,
    )
    await user.click(screen.getByRole('button', { name: 'Actions' }))

    await waitFor(() => expect(items()).toHaveLength(2))
    expect(items().map((el) => el.textContent)).toEqual(['Move', 'Rename'])
  })

  it('names a section and ties its items to that label', async () => {
    const user = userEvent.setup()
    render(
      <Dropdown trigger={(props) => <Button {...props}>Actions</Button>}>
        <DropdownSection label="Edit">
          <DropdownItem>Rename</DropdownItem>
        </DropdownSection>
      </Dropdown>,
    )
    await user.click(screen.getByRole('button', { name: 'Actions' }))

    const group = screen.getByRole('group', { name: 'Edit' })
    expect(group).toContainElement(screen.getByRole('menuitem', { name: 'Rename' }))
  })

  /* The shortcut is a visual reminder; the key binding lives elsewhere. Reading
   * it out would make every item's name two things. */
  it('shows a shortcut hint without putting it in the accessible name', async () => {
    const user = userEvent.setup()
    render(
      <Dropdown trigger={(props) => <Button {...props}>Actions</Button>}>
        <DropdownItem shortcut="⌘E" tone="danger">Delete</DropdownItem>
      </Dropdown>,
    )
    await user.click(screen.getByRole('button', { name: 'Actions' }))

    const item = screen.getByRole('menuitem', { name: 'Delete' })
    expect(item).toHaveAttribute('data-tone', 'danger')
    expect(item.textContent).toContain('⌘E')
  })

  it('opens an empty menu without falling over', async () => {
    /* A menu whose items are all conditional can legitimately render none. The
     * open path focuses "the first item"; there isn't one. */
    const user = userEvent.setup()
    render(<Dropdown trigger={(props) => <Button {...props}>Actions</Button>}>{null}</Dropdown>)

    await user.click(screen.getByRole('button', { name: 'Actions' }))

    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(screen.queryAllByRole('menuitem')).toHaveLength(0)
  })

  /* THE DEFAULT IS PART OF THE CONTRACT, and every test above passes
     `closeOnSelect` explicitly, so the component's own default was never
     exercised: a mutation run flipped `closeOnSelect = true` to `false` and the
     whole suite stayed green (2026-08-29). A menu that stays open after a pick
     is a menu the reader has to dismiss twice. */
  it('closes on select when nothing was said about it', async () => {
    const user = userEvent.setup()
    render(
      <Dropdown trigger={(props) => <Button {...props}>Actions</Button>}>
        <DropdownItem>Rename</DropdownItem>
      </Dropdown>,
    )
    await user.click(screen.getByRole('button', { name: 'Actions' }))
    await user.click(screen.getByRole('menuitem', { name: 'Rename' }))
    await waitFor(() => { expect(screen.queryByRole('menu')).toBeNull() })
  })
})
