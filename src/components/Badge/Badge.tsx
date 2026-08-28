import './Badge.css'
import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'ai'
type Fill = 'solid' | 'soft' | 'plain'
type Size = 'sm' | 'md'

type Props = HTMLAttributes<HTMLSpanElement> & {
  /** The MEANING, never decoration: `success` is a state the reader can stop
   *  worrying about, `warning` needs them eventually, `danger` needs them now.
   *  `neutral` (default) is the honest answer when a value has no state at all —
   *  a category, a plan name, a count. A tone chosen because it looks good on
   *  the card is a badge that lies. */
  tone?: Tone
  /** Visual fill. `solid` (default) = saturated bg; `soft` = tinted bg + dark text; `plain` = no bg, tone-coloured text. */
  fill?: Fill
  /** `sm` (default) = compact tag; `md` = matches a small button (height + padding). */
  size?: Size
}

/**
 * Status chip: a small standalone pill that labels state through `tone`. Not
 * CountBadge, which pins a number to another element's corner.
 *
 * Copy: one word for a state the reader recognises — "Active", "Overdue". A
 * badge that needs three words is a sentence, and belongs in the body.
 */
export function Badge({ tone = 'neutral', fill, size, className, ...rest }: Props) {
  return (
    <span
      className={cn('badge', className)}
      data-tone={tone}
      data-fill={fill}
      data-size={size}
      {...rest}
    />
  )
}
