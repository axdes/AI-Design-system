import './Divider.css'
import { type ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Props = {
  /** Default horizontal; vertical divides a row (needs a sized flex parent). */
  orientation?: 'horizontal' | 'vertical'
  /** Optional centred label on a horizontal rule ("OR", a section name). */
  children?: ReactNode
  className?: string
}

/* The one hairline separator. A horizontal rule between sections, or a vertical
 * one between inline items. With children it becomes a labelled divider (the
 * rule runs either side of the text). Decorative unless labelled: role=separator
 * only when it carries no text, so a screen reader is not told about a rule that
 * is purely visual noise. */
export function Divider({ orientation = 'horizontal', children, className }: Props) {
  if (children) {
    return (
      <div className={cn('divider', 'divider-labelled', className)} data-orientation="horizontal">
        <span className="divider-label">{children}</span>
      </div>
    )
  }
  return (
    <div className={cn('divider', className)} data-orientation={orientation} role="separator" aria-orientation={orientation} />
  )
}
