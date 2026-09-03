import './ListItem.css'
import { useId, type ButtonHTMLAttributes, type ReactNode } from 'react'
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

/**
 * A LABELLED RUN OF ROWS, for a list long enough that the reader is looking for
 * a section before they look for a row. The heading is not one of the rows: it
 * is smaller, heavier, uppercase and tracked, and there is a step of air above
 * it, because a label that shares its size, weight and colour with the rows
 * under it is read as another row.
 *
 * That treatment is not new here. `<SideNav>` has drawn its group labels this
 * way since it was written, privately, and the second list that needed one
 * reached for an eyebrow instead and got a 12px medium grey label over 13px
 * regular grey rows, which the owner read off the components catalogue as
 * "headings that blend into the ordinary items" (2026-08-31). Second use is
 * what moves a thing into the system, so it moved.
 *
 * `role="group"` with the label as its name, so a screen reader announces which
 * section a row belongs to instead of a flat run of a hundred and forty.
 *
 * Copy: the label names the section in the reader's words, not the schema's,
 * and it is a noun — "Actions", not "Action components".
 */
export function ListGroup({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  const labelId = useId()
  return (
    <div className={cn('list-group', className)} role="group" aria-labelledby={labelId}>
      <div id={labelId} className="list-group-label">{label}</div>
      {children}
    </div>
  )
}
