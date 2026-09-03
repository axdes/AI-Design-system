import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { Icon } from './Icon'

/* Every glyph in the system. Two decisions live here and both are invisible
 * until they are wrong: an icon is decoration and must not be announced, and
 * its size comes from CSS rather than from the library, so that changing
 * --icon-sm in the settings layer actually changes every icon. */

describe('Icon', () => {
  it('is hidden from anyone reading with their ears', () => {
    const { container } = render(<Icon name="search" />)
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })

  /* The library writes its own width on the svg and CSS overrides it; what
   * matters is that the SIZE PROP never reaches the library. If it did, an icon
   * would carry a hard number and changing --icon-sm in the settings layer
   * would move every icon in the system except the ones already rendered. */
  it('says its size as data only, so the token drives it and the prop does not', () => {
    const { container, rerender } = render(<Icon name="search" />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('data-size', 'sm')
    const widthAtSm = svg?.getAttribute('width')

    rerender(<Icon name="search" size="xl" />)
    const bigger = container.querySelector('svg')
    expect(bigger).toHaveAttribute('data-size', 'xl')
    expect(bigger?.getAttribute('width')).toBe(widthAtSm)
  })

  it('keeps its own class beside whatever the caller adds', () => {
    const { container } = render(<Icon name="search" className="link-arrow" />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveClass('icon')
    expect(svg).toHaveClass('link-arrow')
  })
})
