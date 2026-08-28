import './ListItem.css'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'
import { Icon, type IconName } from '../Icon'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** A marker at the head of the row, so the rows read as a list. One icon
   *  for the whole list. */
  icon?: IconName
}

/**
 * One clickable row of a list: an optional marker, leading media, title, meta
 * and a trailing action, all inside the row's own hit area.
 */
export function ListItem({ className, type = 'button', icon, children, ...rest }: Props) {
  return (
    <button type={type} className={cn('list-item', className)} data-icon={icon ? '' : undefined} {...rest}>
      {icon && <Icon name={icon} size="sm" className="list-item-marker" aria-hidden="true" />}
      {icon ? <span className="list-item-body">{children}</span> : children}
    </button>
  )
}
