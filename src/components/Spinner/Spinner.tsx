import './Spinner.css'
import { cn } from '../../lib/cn'
import { Icon } from '../Icon'

type Size = 'sm' | 'md' | 'lg' | 'xl'

type Props = {
  /** Matches the icon scale: sm 16 / md 20 / lg 24 / xl 40. Default 'md'. */
  size?: Size
  /** Accessible name announced to screen readers. A spinner with no label is a
   *  silent "something is happening" — always say what. */
  label: string
  className?: string
}

/* The one busy indicator for the whole system: a rotating loader icon. Inline by
 * default (sits next to text or inside a button); center it with the layout
 * around it. Animation is paused under prefers-reduced-motion (reset.css). 
   *
   * Copy: the label says what is being waited for — "Loading invoices" — and it is
   * announced, so it is a sentence a person can hear.
   */
export function Spinner({ size = 'md', label, className }: Props) {
  return (
    <span className={cn('spinner', className)} role="status" data-size={size}>
      <Icon name="progress_activity" size={size} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  )
}
