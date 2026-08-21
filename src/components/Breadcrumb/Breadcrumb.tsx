import './Breadcrumb.css'
import { Fragment, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { Icon } from '../Icon'

export type Crumb = {
  label: string
  /** Anchor href, or omit for an onSelect button. The LAST crumb ignores both
   *  and renders as plain current-page text. */
  href?: string
  onSelect?: () => void
}

type Props = {
  items: Crumb[]
  /** Accessible name for the nav landmark. Default "Breadcrumb". */
  label?: string
  className?: string
}

/* The trail back up a record hierarchy, e.g. Library / Reports / Q3. Routing
 * agnostic: pass `href` for anchors, `onSelect` for buttons. The last item is
 * always the current page (aria-current), not a link. Replaces the old habit of
 * faking a breadcrumb with a subtitle string. */
export function Breadcrumb({ items, label = 'Breadcrumb', className }: Props) {
  return (
    <nav className={cn('breadcrumb', className)} aria-label={label}>
      <ol className="breadcrumb-list">
        {items.map((item, i) => {
          const last = i === items.length - 1
          let content: ReactNode
          if (last) content = <span className="breadcrumb-current" aria-current="page">{item.label}</span>
          else if (item.href) content = <a className="breadcrumb-link" href={item.href}>{item.label}</a>
          else content = <button type="button" className="breadcrumb-link" onClick={item.onSelect}>{item.label}</button>

          return (
            <Fragment key={item.label}>
              <li className="breadcrumb-item">{content}</li>
              {!last && <li className="breadcrumb-sep" aria-hidden="true"><Icon name="chevron_right" /></li>}
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
}
