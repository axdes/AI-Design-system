import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Breadcrumb } from './Breadcrumb'

/* A breadcrumb that renders the current page as a link sends the user in a
 * circle, and separators read aloud as "chevron right chevron right" if they are
 * not hidden. Both are invisible in a screenshot. */

describe('Breadcrumb', () => {
  it('marks the last crumb as the current page and does not link it', () => {
    render(
      <Breadcrumb
        items={[
          { label: 'Library', href: '/library' },
          { label: 'Reports', href: '/library/reports' },
          { label: 'Q3' },
        ]}
      />,
    )

    const current = screen.getByText('Q3')
    expect(current).toHaveAttribute('aria-current', 'page')
    expect(screen.queryByRole('link', { name: 'Q3' })).toBeNull()
    expect(screen.getAllByRole('link')).toHaveLength(2)
  })

  it('ignores href and onSelect on the last crumb', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(<Breadcrumb items={[{ label: 'Library', href: '/library' }, { label: 'Q3', href: '/q3', onSelect }]} />)

    await user.click(screen.getByText('Q3'))

    expect(onSelect).not.toHaveBeenCalled()
    expect(screen.queryByRole('link', { name: 'Q3' })).toBeNull()
  })

  it('renders a button crumb when there is no href', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(<Breadcrumb items={[{ label: 'Library', onSelect }, { label: 'Q3' }]} />)

    await user.click(screen.getByRole('button', { name: 'Library' }))
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('is a named landmark', () => {
    render(<Breadcrumb label="You are here" items={[{ label: 'A', href: '/a' }, { label: 'B' }]} />)
    expect(screen.getByRole('navigation', { name: 'You are here' })).toBeInTheDocument()
  })

  it('hides the separators from assistive technology', () => {
    const { container } = render(
      <Breadcrumb items={[{ label: 'A', href: '/a' }, { label: 'B', href: '/b' }, { label: 'C' }]} />,
    )

    const seps = container.querySelectorAll('.breadcrumb-sep')
    expect(seps).toHaveLength(2)
    for (const s of seps) expect(s).toHaveAttribute('aria-hidden', 'true')
  })

  it('renders a single crumb as the current page', () => {
    render(<Breadcrumb items={[{ label: 'Only' }]} />)

    expect(screen.getByText('Only')).toHaveAttribute('aria-current', 'page')
    expect(screen.queryByRole('link')).toBeNull()
  })
})
