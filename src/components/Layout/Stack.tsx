import './Layout.css'
import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type Gap = 1 | 2 | 3 | 4 | 6 | 8 | 12 | 16

type Props = HTMLAttributes<HTMLDivElement> & {
  gap?: Gap
}

export function Stack({ gap = 4, className, ...rest }: Props) {
  return (
    <div
      className={cn('stack', className)}
      data-gap={gap}
      {...rest}
    />
  )
}
