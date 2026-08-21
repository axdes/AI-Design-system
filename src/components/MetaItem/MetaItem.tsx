import './MetaItem.css'
import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'
import { Icon, type IconName } from '../Icon'

type Props = HTMLAttributes<HTMLSpanElement> & {
  icon?: IconName
  /** `meta` (default) = ambient text + dimmed icon (dates, counters). `eyebrow` =
   *  small fully-muted kicker label above a title. Absorbs the old <Eyebrow>. */
  appearance?: 'meta' | 'eyebrow'
}

/**
 * One piece of secondary information (a date, an owner, a count) with its
 * icon, sized to sit under a title.
 */
export function MetaItem({ icon, appearance, children, className, ...rest }: Props) {
  return (
    <span className={cn('meta-item', className)} data-appearance={appearance} {...rest}>
      {icon && <Icon name={icon} />}
      {children}
    </span>
  )
}
