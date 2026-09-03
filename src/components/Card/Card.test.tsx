import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card, CardHeader, CardTitle, CardMeta } from './index'

/* The surface almost everything in this system sits on. It has no behaviour;
 * what it has is a set of flags that CSS reads, and two of them decide whether
 * the thing that renders on it is a card at all — so an absent flag must stay
 * absent rather than arrive as "false", which reads as present to an attribute
 * selector. */

describe('Card', () => {
  it('declares itself a raised surface, always', () => {
    const { container } = render(<Card>content</Card>)
    expect(container.firstElementChild).toHaveAttribute('data-raised', 'card')
  })

  it('leaves every flag it was not given absent, not false', () => {
    const { container } = render(<Card>content</Card>)
    const card = container.firstElementChild!
    for (const flag of ['data-interactive', 'data-flat', 'data-fill', 'data-tight', 'data-flush']) {
      expect(card).not.toHaveAttribute(flag)
    }
  })

  it('carries the flags it was given', () => {
    const { container } = render(<Card interactive tight>content</Card>)
    const card = container.firstElementChild!
    expect(card).toHaveAttribute('data-interactive')
    expect(card).toHaveAttribute('data-tight')
  })

  /* The title defaults to h2 rather than to nothing: a card in a page is under
   * the page title, and a heading that skips a level is how an outline breaks. */
  it('gives its title a heading level, and takes another when the outline needs one', () => {
    const { rerender } = render(<Card><CardHeader><CardTitle>Sessions</CardTitle></CardHeader></Card>)
    expect(screen.getByRole('heading', { level: 2, name: 'Sessions' })).toBeInTheDocument()

    rerender(<Card><CardHeader><CardTitle as="h3">Sessions</CardTitle></CardHeader></Card>)
    expect(screen.getByRole('heading', { level: 3, name: 'Sessions' })).toBeInTheDocument()
  })

  /* There is no CardBody on purpose: the body of a card is whatever the card is
   * about, and a wrapper that only adds padding would be a component with no
   * decision in it. The named parts are the ones that carry a rule. */
  it('carries its meta line as a named part rather than as loose text', () => {
    const { container } = render(<Card><CardMeta>Updated today</CardMeta></Card>)
    expect(container.querySelector('.card-meta')).toHaveTextContent('Updated today')
  })
})
