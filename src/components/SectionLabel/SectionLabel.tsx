import './SectionLabel.css'
import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

/**
 * The heading that names a section inside a page or a panel: the voice of a card
 * title, one step larger. Rank comes from size and colour, not from caps.
 */
export function SectionLabel({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('section-label', className)} {...rest} />
}
