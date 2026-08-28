import './BrandMark.css'
import { type ReactNode } from 'react'
import { Icon } from '../Icon'
import { cn } from '../../lib/cn'

type Props = {
  /** The mark itself, drawn in ink that reads on a brand fill (`<Logo tone="inverse" />`). */
  children: ReactNode
  /**
   * Which way the swap arrow points, and therefore what pressing it does.
   * `collapse` for the expanded rail's lockup, `expand` for the collapsed
   * rail's mark. The slot cannot ask the rail which state it is in, so it is
   * told: the two slots are two different pictures of the same control.
   */
  direction?: 'collapse' | 'expand'
  className?: string
}

/**
 * The brand mark in its cap: a filled circle the size of a rail item, with the
 * mark inside it cross-fading to an arrow when the pointer or the keyboard
 * arrives.
 *
 * It lives here rather than inside `<SideNav>` for the reason SideNav's own CSS
 * gives: a component that capped whatever logo it was handed would turn a
 * wordmark into white text in a coloured disc. Capping is the product's choice.
 * It lives here rather than in each product because two of them had already
 * written the same fifteen lines — the circle, the rail-item size, the brand
 * fill, the inverse ink — which is the second use that moves a thing into the
 * system.
 *
 * Pass it in BOTH slots. Expanded it caps the mark beside the wordmark and its
 * arrow points inward — press to collapse. Collapsed it is the whole of what
 * the rail shows, the biggest target on it, and its arrow points outward. The
 * circle never leaves, so the brand does not change shape when the rail does.
 */
export function BrandMark({ children, direction = 'collapse', className }: Props) {
  return (
    <span className={cn('brand-mark', className)}>
      {children}
      <Icon name={direction === 'expand' ? 'arrow_right_to_line' : 'arrow_left_to_line'} size="md" className="brand-mark-swap" />
    </span>
  )
}
