import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { BrandMark } from './BrandMark'

/* The logo in a sidebar that doubles as the collapse control. The glyph beside
 * it points the way the rail is about to move, and pointing the wrong way is
 * the only thing that can be wrong here. */

describe('BrandMark', () => {
  it('points inward while the rail is open, because pressing it collapses', () => {
    const { container } = render(<BrandMark><span>Acme</span></BrandMark>)
    expect(container.querySelector('.brand-mark-swap')).toBeInTheDocument()
  })

  it('renders the brand it was given, whatever that is', () => {
    const { container } = render(<BrandMark><img alt="Acme" src="/logo.svg" /></BrandMark>)
    expect(container.querySelector('img')).toHaveAttribute('alt', 'Acme')
  })
})
