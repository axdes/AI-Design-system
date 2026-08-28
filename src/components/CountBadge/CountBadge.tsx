import './CountBadge.css'
import { type ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Tone = 'primary' | 'danger' | 'success'

type Props = {
  /** The element the marker sits on (an Icon, IconButton, Avatar). */
  children: ReactNode
  /** Numeric count. Values over `max` render as `${max}+`. Omit for a plain dot. */
  count?: number
  /** Show a small dot with no number (e.g. "unread", "online"). */
  dot?: boolean
  max?: number
  tone?: Tone
  /** Read out to a screen reader, e.g. "3 unread". Without it the marker is
   *  decorative (aria-hidden) — pass it whenever the count carries meaning. */
  label?: string
  className?: string
}

/* A count or dot pinned to the top-inline-end corner of whatever it wraps —
 * notifications on a bell, unread on an avatar. Distinct from <Badge>, which is
 * a standalone status pill. Hidden entirely when count is 0 and no dot. 
   *
   * Copy: the accessible label counts the thing, not the badge — "3 unread
   * messages". A number alone is read as "three" with nothing to attach it
   * to.
   */
export function CountBadge({ children, count, dot, max = 99, tone = 'danger', label, className }: Props) {
  const show = dot || (count !== undefined && count > 0)
  const text = count !== undefined ? (count > max ? `${max}+` : String(count)) : ''
  return (
    <span className={cn('count-badge', className)}>
      {children}
      {show && (
        <span className="count-badge-marker" data-tone={tone} data-dot={dot || undefined} data-wide={text.length > 1 || undefined} aria-hidden={label ? undefined : 'true'}>
          {!dot && text}
          {label && <span className="sr-only">{label}</span>}
        </span>
      )}
    </span>
  )
}
