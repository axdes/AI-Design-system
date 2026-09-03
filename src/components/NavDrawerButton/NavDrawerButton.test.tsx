import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NavDrawerButton } from './NavDrawerButton'
import { SidebarProvider, useSidebar } from '../../lib/SidebarProvider'

/* The one control that opens the navigation drawer. Its whole design is a
 * refusal: outside a sidebar it renders NOTHING, because the version that
 * rendered anyway was a fixed button floating over every screen, colliding with
 * the header it was meant to sit in. */

function Probe() {
  const { mobileOpen } = useSidebar()
  return <span data-testid="state">{mobileOpen ? 'open' : 'closed'}</span>
}

describe('NavDrawerButton', () => {
  it('renders nothing at all where there is no sidebar to open', () => {
    const { container } = render(<NavDrawerButton />)
    expect(container).toBeEmptyDOMElement()
  })

  it('opens the drawer where there is one', async () => {
    render(
      <SidebarProvider>
        <NavDrawerButton />
        <Probe />
      </SidebarProvider>,
    )
    expect(screen.getByTestId('state')).toHaveTextContent('closed')

    await userEvent.click(screen.getByRole('button', { name: /menu/i }))
    expect(screen.getByTestId('state')).toHaveTextContent('open')
  })
})
