import './ListItem.css'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

/**
 * One clickable row of a list: leading media, title, meta and a trailing
 * action, all inside the row's own hit area.
 */
export function ListItem({
  className,
  type = 'button',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={cn('list-item', className)} {...rest} />
}
