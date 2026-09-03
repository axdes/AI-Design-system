import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserMenu } from './UserMenu'

/* Who you are, at the far end of the header, with what you can do about it
 * behind one press. The trigger carries a name of its own because the face and
 * the name inside it are not a label a screen reader can act on. */

describe('UserMenu', () => {
  it('is one named trigger showing who is signed in', () => {
    render(<UserMenu name="Ada Lovelace" secondary="Admin" actions={[]} />)
    const trigger = screen.getByRole('button', { name: 'Account menu' })
    expect(trigger).toHaveTextContent('Ada Lovelace')
    expect(trigger).toHaveTextContent('Admin')
  })

  it('keeps the actions behind the press rather than in the header', async () => {
    const onSelect = vi.fn()
    render(<UserMenu name="Ada" actions={[{ id: 'signout', label: 'Sign out', onSelect }]} />)
    expect(screen.queryByText('Sign out')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Account menu' }))
    await userEvent.click(screen.getByText('Sign out'))
    expect(onSelect).toHaveBeenCalledOnce()
  })

  it('takes its own name for the menu when a product calls it something else', () => {
    render(<UserMenu name="Ada" actions={[]} menuLabel="Your account" />)
    expect(screen.getByRole('button', { name: 'Your account' })).toBeInTheDocument()
  })

  /* The secondary is the second line and it is optional: a product with one kind of
   * user has nothing to put there, and an empty line under the name reads as a
   * value that failed to load. */
  it('shows the second line only when there is a secondary to show', () => {
    const { container, rerender } = render(<UserMenu name="Ada Lovelace" actions={[]} />)
    expect(container.querySelector('.user-menu-trigger-secondary')).toBeNull()

    rerender(<UserMenu name="Ada Lovelace" secondary="Admin" actions={[]} />)
    expect(container.querySelector('.user-menu-trigger-secondary')).toHaveTextContent('Admin')
  })

  it('shows the person’s own picture when there is one', () => {
    const { container } = render(
      <UserMenu name="Ada Lovelace" avatarSrc="/ada.png" actions={[{ id: 'out', label: 'Sign out', onSelect: () => undefined }]} />,
    )
    expect(container.querySelector('img')).toHaveAttribute('src', '/ada.png')
  })
})
