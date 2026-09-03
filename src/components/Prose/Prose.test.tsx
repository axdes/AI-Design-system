import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Prose } from './Prose'

/* A paragraph of words. The element is the decision: prose inside a card is
 * usually a <p>, but the same treatment on a <span> is what lets it sit inside
 * a sentence without putting a block element in the middle of one. */

describe('Prose', () => {
  /* A paragraph or a div, and nothing else: prose is a block of words, and the
   * two elements that mean that are the two it accepts. */
  it('is a paragraph unless it is told to be a div', () => {
    const { rerender } = render(<Prose>Words.</Prose>)
    expect(screen.getByText('Words.').tagName).toBe('P')

    rerender(<Prose as="div">Words.</Prose>)
    expect(screen.getByText('Words.').tagName).toBe('DIV')
  })

  it('always says its size and its appearance, so nothing downstream guesses', () => {
    render(<Prose>Words.</Prose>)
    const prose = screen.getByText('Words.')
    expect(prose).toHaveAttribute('data-size', 'md')
    expect(prose).toHaveAttribute('data-appearance', 'muted')
  })
})
