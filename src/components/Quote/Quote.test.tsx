import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Quote } from './Quote'

/* Somebody's words, attributed. The markup is the point: a blockquote inside a
 * figure with its figcaption is what makes the attribution part of the quote
 * rather than a line of text that happens to sit under it. */

describe('Quote', () => {
  it('is a figure with a real blockquote and a real caption', () => {
    const { container } = render(<Quote by="Ada Lovelace">The engine weaves patterns.</Quote>)
    const figure = container.querySelector('figure')
    expect(figure?.querySelector('blockquote')).toHaveTextContent('The engine weaves patterns.')
    expect(figure?.querySelector('figcaption')).toHaveTextContent('Ada Lovelace')
  })

  it('carries the source beside the person, and stands without one', () => {
    const { container, rerender } = render(<Quote by="Ada Lovelace" source="Notes, 1843">Words.</Quote>)
    expect(screen.getByText('Notes, 1843')).toBeInTheDocument()

    rerender(<Quote by="Ada Lovelace">Words.</Quote>)
    expect(container.querySelector('.quote-source')).toBeNull()
  })

  it('hides its decorative mark from anyone reading with their ears', () => {
    const { container } = render(<Quote by="Ada">Words.</Quote>)
    expect(container.querySelector('.quote-mark')).toHaveAttribute('aria-hidden', 'true')
  })
})
