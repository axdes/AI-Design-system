import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Link } from './Link'

/* A link. The half worth testing is the one about leaving: a link that opens a
 * new tab has to say so and must not hand the new page a live reference back to
 * this one (rel=noopener), and the glyph that says it is decoration. */

describe('Link', () => {
  it('is a plain link by default, with no target and no rel', () => {
    render(<Link href="/settings">Settings</Link>)
    const link = screen.getByRole('link', { name: 'Settings' })
    expect(link).not.toHaveAttribute('target')
    expect(link).not.toHaveAttribute('rel')
  })

  it('opens outward safely, and says so with a glyph nobody has to hear', () => {
    const { container } = render(<Link href="https://example.com" external>Docs</Link>)
    const link = screen.getByRole('link', { name: 'Docs' })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(container.querySelector('.link-external')).toHaveAttribute('aria-hidden', 'true')
  })

  /* The arrow is for a link that leads onward INSIDE the product. Drawing both
   * would say two different things about where the reader is going. */
  it('does not draw both an arrow and an outward glyph', () => {
    const { container } = render(<Link href="https://example.com" external arrow>Docs</Link>)
    expect(container.querySelector('.link-arrow')).toBeNull()
    expect(container.querySelector('.link-external')).toBeInTheDocument()
  })

  it('hands its markup to a router link when one is given, keeping the class', () => {
    render(
      <Link
        variant="quiet"
        render={(inner, props) => <a {...props} href="/routed" data-testid="routed">{inner}</a>}
      >
        Go
      </Link>,
    )
    const link = screen.getByTestId('routed')
    expect(link).toHaveClass('link')
    expect(link).toHaveAttribute('data-variant', 'quiet')
  })
})
