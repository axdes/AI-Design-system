import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Sparkline } from './Sparkline'

/* A trend line with no axes has one job: be the right SHAPE. jsdom draws
 * nothing, so the path is read as the arithmetic it is — and the arithmetic is
 * where a sparkline goes wrong, at the two ends nobody has data for. */

const path = () => document.querySelector('.sparkline-line')?.getAttribute('d') ?? ''

describe('Sparkline', () => {
  it('draws nothing at all below two points, because one point has no shape', () => {
    const { container, rerender } = render(<Sparkline values={[5]} label="Signups" />)
    expect(container).toBeEmptyDOMElement()

    rerender(<Sparkline values={[]} label="Signups" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('spreads the series across the whole width and puts the newest at the end', () => {
    render(<Sparkline values={[1, 2, 3]} label="Signups" />)
    expect(path()).toBe('M0.00 30.00 L50.00 16.00 L100.00 2.00')
  })

  /* A series that has not moved is drawn down the MIDDLE. It used to be drawn
   * along the floor, because with no span there was nothing to divide by and
   * the fallback put every point at the bottom — which reads as a value pinned
   * at zero, the one thing a flat series does not say. Found by this test on
   * its first run, 2026-09-03. */
  it('draws a series that did not move down the middle, not along the floor', () => {
    render(<Sparkline values={[7, 7, 7]} label="Signups" />)
    expect(path()).toBe('M0.00 16.00 L50.00 16.00 L100.00 16.00')
  })

  it('is an image when it is named and decoration when it is not', () => {
    const { rerender } = render(<Sparkline values={[1, 2]} label="Signups this week" />)
    expect(screen.getByRole('img', { name: 'Signups this week' })).toBeInTheDocument()

    rerender(<Sparkline values={[1, 2]} />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})
