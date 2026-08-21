import './Layout.css'
import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type Gap = 1 | 2 | 3 | 4 | 6 | 8 | 12 | 16

type Props = HTMLAttributes<HTMLDivElement> & {
  gap?: Gap
  align?: 'start' | 'center' | 'end'
  justify?: 'between'
}

export function Row({ gap = 3, align, justify, className, ...rest }: Props) {
  return (
    <div
      className={cn('row', className)}
      data-gap={gap}
      data-align={align}
      data-justify={justify}
      {...rest}
    />
  )
}
