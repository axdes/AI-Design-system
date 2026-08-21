import './FormStack.css'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

/* Vertical stack of Fields inside a modal or panel. The single shared layout
 * for create/edit forms: every form gets identical rhythm from one place
 * instead of each page hand-rolling its own flex column. */
export function FormStack({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('form-stack', className)}>{children}</div>
}
