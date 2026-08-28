import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SideNav } from './SideNav'

/* The rail is either controlled by its consumer or owns its own state, and
 * getting that wrong is silent: a controlled rail that also flips internally
 * looks fine until the consumer tries to keep two rails in step. The other half
 * is `aria-current`, which is the only thing telling a screen reader which page
 * of the whole app the user is on. */

const groups = [
  { label: 'Work', items: [
    { id: 'inbox', label: 'Inbox', href: '/inbox', active: true },
    { id: 'drafts', label: 'Drafts', href: '/drafts' },
  ] },
]

describe('SideNav', () => {
  it('is a named landmark with its items inside', () => {
    render(<SideNav groups={groups} aria-label="Primary" />)

    expect(screen.getByRole('complementary', { name: 'Primary' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Inbox' })).toBeInTheDocument()
  })

  it('marks exactly the active item as the current page', () => {
    render(<SideNav groups={groups} />)

    expect(screen.getByRole('link', { name: 'Inbox' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Drafts' })).not.toHaveAttribute('aria-current')
  })

  it('renders a button when there is no href, and calls back on it', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(<SideNav groups={[{ items: [{ id: 'a', label: 'Settings', onSelect }] }]} />)

    await user.click(screen.getByRole('button', { name: 'Settings' }))
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('collapses itself when nobody else owns the state', async () => {
    const user = userEvent.setup()
    render(<SideNav groups={groups} />)

    const toggle = screen.getByRole('button', { name: 'Collapse navigation' })
    expect(toggle).toHaveAttribute('aria-expanded', 'true')

    await user.click(toggle)

    expect(screen.getByRole('button', { name: 'Expand navigation' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('does not move on its own when the consumer owns the state', async () => {
    const onCollapsedChange = vi.fn()
    const user = userEvent.setup()
    render(<SideNav groups={groups} collapsed={false} onCollapsedChange={onCollapsedChange} />)

    await user.click(screen.getByRole('button', { name: 'Collapse navigation' }))

    /* It asks, and waits to be told. Flipping internally as well would put a
     * controlled rail out of step with whatever else the consumer drives. */
    expect(onCollapsedChange).toHaveBeenCalledWith(true)
    expect(screen.getByRole('button', { name: 'Collapse navigation' })).toBeInTheDocument()
  })

  it('honours a starting collapsed state', () => {
    render(<SideNav groups={groups} defaultCollapsed />)
    expect(screen.getByRole('button', { name: 'Expand navigation' })).toBeInTheDocument()
  })

  it('offers no collapse affordance when it cannot collapse', () => {
    render(<SideNav groups={groups} collapsible={false} logo={<span>Brand</span>} collapseControl="both" />)

    expect(screen.queryByRole('button', { name: /navigation/i })).toBeNull()
  })

  it('swaps the full lockup for the mark when collapsed', () => {
    const { rerender } = render(
      <SideNav groups={groups} logo={<span>Acme Analytics</span>} logoMark={<span>A</span>} />,
    )
    expect(screen.getByText('Acme Analytics')).toBeInTheDocument()

    rerender(<SideNav groups={groups} logo={<span>Acme Analytics</span>} logoMark={<span>A</span>} collapsed />)

    /* A wordmark does not fit the collapsed rail; without the swap it is clipped. */
    expect(screen.queryByText('Acme Analytics')).toBeNull()
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('carries `usage` onto the entry, as a button and as a link', () => {
    /* The attribute is what a product's usage log reads. It has to survive both shapes,
     * or an app that navigates with hrefs records nothing where an app that navigates
     * with callbacks records everything. */
    render(
      <SideNav groups={[{ items: [
        { id: 'a', label: 'Team one 2.1', usage: 'Team on the rail', onSelect: () => {} },
        { id: 'b', label: 'Team two 0.4', usage: 'Team on the rail', href: '/two' },
      ] }]} />,
    )

    expect(screen.getByRole('button', { name: 'Team one 2.1' })).toHaveAttribute('data-usage', 'Team on the rail')
    expect(screen.getByRole('link', { name: 'Team two 0.4' })).toHaveAttribute('data-usage', 'Team on the rail')
  })

  it('leaves the attribute off an entry that did not ask for one', () => {
    render(<SideNav groups={[{ items: [{ id: 'a', label: 'Plain', onSelect: () => {} }] }]} />)

    expect(screen.getByRole('button', { name: 'Plain' })).not.toHaveAttribute('data-usage')
  })

  it('can be collapsed from the logo when asked', async () => {
    const user = userEvent.setup()
    render(<SideNav groups={groups} logo={<span>Brand</span>} collapseControl="logo" />)

    await user.click(screen.getByRole('button', { name: 'Collapse navigation' }))

    expect(screen.getByRole('button', { name: 'Expand navigation' })).toBeInTheDocument()
  })
})

describe('SideNav routing', () => {
  it('lets the consumer bring its own link, so navigation stays a link', () => {
    /* Without this the only two options are an anchor that reloads the whole
       document and a button, and all three products picked the button — which
       cannot be middle-clicked, cannot have its address copied, and is
       announced as a button to somebody who is navigating. */
    render(
      <SideNav
        aria-label="Primary"
        groups={[{ items: [{ id: 'a', label: 'Reports', icon: 'article', active: true,
          render: (inner, props) => <a {...props} href="/reports" data-router="yes">{inner}</a> }] }]}
      />,
    )
    const link = screen.getByRole('link', { name: 'Reports' })
    expect(link).toHaveAttribute('data-router', 'yes')
    expect(link).toHaveAttribute('aria-current', 'page')
    expect(link).toHaveClass('side-nav-item')
  })

  it('still renders a button when the consumer only has a handler', () => {
    render(<SideNav aria-label="Primary" groups={[{ items: [{ id: 'a', label: 'Reports', icon: 'article', onSelect: () => undefined }] }]} />)
    expect(screen.getByRole('button', { name: 'Reports' })).toBeInTheDocument()
  })
})
