import './ConditionalReveal.css'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Props = {
  /** True when the option this content belongs to is the chosen one. */
  when: boolean
  children: ReactNode
  className?: string
}

/* The follow-up question that only exists because of an answer above it: "Other
 * — please say what", "Yes — from which date". Two rules make it work and both
 * are easy to get wrong by hand. It is UNMOUNTED rather than hidden, so a
 * hidden field cannot be submitted, focused or validated; and it is rendered
 * directly under its own option rather than at the end of the group, so the
 * connection is visible instead of remembered (GOV.UK conditional reveal). */

/** The dependent field under an option: present only while that option is
 *  chosen, indented under it so the two read as one question. */
export function ConditionalReveal({ when, children, className }: Props) {
  if (!when) return null
  return <div className={cn('conditional-reveal', className)}>{children}</div>
}
