import './Kbd.css'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Props = {
  children: ReactNode
  /** sm (default) sits inline with body text; md is for standalone shortcut lists. */
  size?: 'sm' | 'md'
  className?: string
}

/* One key as a key cap, with real <kbd> semantics: the shortcut hint next to a
 * CommandPalette trigger, a menu row, a help sheet. One Kbd per key; compose a
 * combination as siblings with a plain "+" between them. */
export function Kbd({ children, size = 'sm', className }: Props) {
  return (
    <kbd className={cn('kbd', className)} data-size={size}>
      {children}
    </kbd>
  )
}
