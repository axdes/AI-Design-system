import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { IconDisc } from './IconDisc'

/* Test the PROMISE, not the markup: what would be broken for a reader if this
 * stopped working. A test that asserts a class name proves nothing. */
describe('IconDisc', () => {
  /* The promise IS the proportion. If a step ever pairs a disc with a glyph
     that is not half of it, the component has stopped being the reason to
     reach for it — a caller could have written that CSS themselves. */
  it('holds every disc to a glyph at half its size', () => {
    const { container, rerender } = render(<IconDisc icon="campaign" size="sm" />)
    const pairs: Array<[string, string]> = []
    for (const size of ['sm', 'md'] as const) {
      rerender(<IconDisc icon="campaign" size={size} />)
      const disc = container.querySelector('.icon-disc')!
      const glyph = disc.querySelector('.icon')!
      pairs.push([disc.getAttribute('data-size')!, glyph.getAttribute('data-size')!])
    }
    /* The disc scale is 32 / 48 and the icon scale is sm=16 / lg=24. Naming the
       expected PAIRS rather than the pixels keeps this readable when the tokens
       are retuned, and still fails the moment someone re-points a step. */
    expect(pairs).toEqual([
      ['sm', 'sm'],
      ['md', 'lg'],
    ])
  })

  it('says nothing to a screen reader, because the words beside it do', () => {
    const { container } = render(<IconDisc icon="campaign" />)
    expect(container.querySelector('.icon')).toHaveAttribute('aria-hidden', 'true')
    expect(container.textContent).toBe('')
  })
})
