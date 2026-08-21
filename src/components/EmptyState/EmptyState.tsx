import './EmptyState.css'
import { createElement, type ReactNode } from 'react'
import { Icon, type IconName } from '../Icon'

/* h1 included on purpose. On a screen whose header carries no title — a
 * placeholder route, a list with nothing in it yet — this heading IS the
 * page's name, and a page with no h1 gives a screen reader nothing to
 * announce it by. Inside a card or a section it stays h2 or lower. */
type Heading = 'h1' | 'h2' | 'h3' | 'h4'

type Props = {
  icon?: IconName
  title: string
  description?: string
  action?: ReactNode
  /** Heading level for the title. Pick to fit the page hierarchy. Default `h2`. */
  as?: Heading
  /** `sm` = tight content areas (chat-history panel, side panels, small cards);
   *  `md` (default) = section/page; `lg` = full-screen hero. */
  size?: 'sm' | 'md' | 'lg'
  /** Surface the empty state sits on, so the icon badge contrasts:
   *  `card` (default) = white surface → grey badge; `page` = grey page → white badge. */
  surface?: 'card' | 'page'
}

/**
 * What a screen shows when it has nothing: an icon, a sentence about why it is
 * empty, and the action that would fill it.
 */
export function EmptyState({ icon, title, description, action, as = 'h2', size = 'md', surface = 'card' }: Props) {
  return (
    <div className="empty-state" data-size={size} data-surface={surface} role="status">
      {icon && (
        <div className="empty-state-icon">
          <Icon name={icon} size="xl" />
        </div>
      )}
      {createElement(as, { className: 'empty-state-title' }, title)}
      {description && <p className="empty-state-description">{description}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  )
}
