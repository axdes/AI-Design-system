import './Layout.css'
import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type Gap = 1 | 2 | 3 | 4 | 6 | 8 | 12 | 16

type Props = HTMLAttributes<HTMLElement> & {
  gap?: Gap
  /**
   * The element this renders as, when the DOCUMENT has an opinion the layout
   * does not: a stack of list items is a list, and a screen reader that is
   * handed a column of divs is told there are no items and no count. Added
   * 2026-08-23, when the system's own site had a list of rules and could not
   * say so in a Stack.
   */
  as?: 'div' | 'ul' | 'ol' | 'section' | 'nav'
}

export function Stack({ gap = 4, as: As = 'div', className, ...rest }: Props) {
  return (
    <As
      className={cn('stack', className)}
      data-gap={gap}
      {...rest}
    />
  )
}
