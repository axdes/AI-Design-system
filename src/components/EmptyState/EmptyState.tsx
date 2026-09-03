import './EmptyState.css'
import { createElement, type ReactNode } from 'react'
import { Icon, type IconName } from '../Icon'

/* h1 included on purpose. On a screen whose header carries no title — a
 * placeholder route, a list with nothing in it yet — this heading IS the
 * page's name, and a page with no h1 gives a screen reader nothing to
 * announce it by. Inside a card or a section it stays h2 or lower. */
type Heading = 'h1' | 'h2' | 'h3' | 'h4'

/**
 * What a PAGE TEMPLATE takes to build one of these: the words, not the element.
 *
 * Three templates declared the same object inline and a fourth declared it
 * without `reason`, so one name carried three shapes and an agent reading the
 * registry saw three questions (2026-09-03). The templates publish it as
 * `emptyState` / `errorState` — `empty` on a DataGrid is arbitrary CONTENT, and
 * a description of a state is not that.
 */
export type PageStateSpec = {
  icon?: IconName
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  /** Only the list templates read it: `no-matches` keeps the header, because
   *  the filter that emptied the list is in it. Default `no-data`. */
  reason?: 'no-data' | 'no-matches'
}

type Props = {
  icon?: IconName
  /* ReactNode, like every other title in this system: a heading routinely
   * carries a status beside the words or a product name in the brand colour,
   * and typing it as a string is what sends a screen off to hand-roll its own
   * header. Widened 2026-09-03; nothing here puts it in an attribute — the
   * dialog labels itself by id, not by the text. */
  title: ReactNode
  /* ReactNode: the same word means the same shape everywhere in this system,
   * and its neighbours already took one. Widened 2026-09-03; it is rendered
   * as content here, never put in an attribute. */
  description?: ReactNode
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
 *
 * Copy: the title says what is missing, not that something is missing — "No
 * invoices yet", never "No results". The description says WHY it is empty
 * and what would fill it; if the reason is a filter, say so, because that
 * is a different screen from a first run.
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
