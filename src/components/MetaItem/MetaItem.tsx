import './MetaItem.css'
import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'
import { Icon, type IconName } from '../Icon'

type Props = HTMLAttributes<HTMLSpanElement> & {
  /** A glyph before the words, and decoration only: it is hidden from screen
   *  readers because the words beside it already say it. A meta item with an
   *  icon and no words is not a meta item. */
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
