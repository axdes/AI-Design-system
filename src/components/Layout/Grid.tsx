import './Layout.css'
import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type Gap = 1 | 2 | 3 | 4 | 6 | 8 | 12 | 16

type Props = HTMLAttributes<HTMLDivElement> & {
  gap?: Gap
}

/**
 * Layout primitives: Stack and Row for gaps in one direction, Grid for an
 * auto-fitting set of cards. `gap` is a token step, never a raw px.
 */
export function Grid({ gap = 4, className, ...rest }: Props) {
  return (
    <div
      className={cn('grid', className)}
      data-gap={gap}
      {...rest}
    />
  )
}
