import './ContentRow.css'
import { type ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Props = {
  /** The media block: a thumbnail tile, an icon tile, an Avatar, a date block. Overlay badges (a duration) belong in here, on their own plate. */
  media?: ReactNode
  /** The kind/category line above the title — pass a `MetaItem appearance="eyebrow"`. */
  eyebrow?: ReactNode
  /** The row's name; the strongest text in the row. */
  title: ReactNode
  /** Opens the record. The title is the control and its hit area stretches over the whole row, so there is one accessible name and one focus stop. */
  onOpen?: () => void
  /** One-two lines of the content itself, clamped; dropped in `compact` and `dense`. */
  excerpt?: ReactNode
  /** The footnote line: date, owner, counts — `MetaItem`s. */
  meta?: ReactNode
  /** Trailing controls (a decision, an overflow menu). They sit above the stretched title, so they stay clickable. */
  actions?: ReactNode
  /** How much of the anatomy survives: rows degrade from the bottom up — `compact` drops the excerpt, `dense` is a single reading line. */
  density?: 'comfortable' | 'compact' | 'dense'
  className?: string
}

/**
 * One CONTENT entry as a row: media, eyebrow, title, excerpt, meta, trailing
 * actions — the anatomy every feed from a repo list to a news teaser shares.
 * Reach for it when an entry carries an excerpt or several meta fields;
 * `ListItem` stays the simple one-line clickable row.
 */
export function ContentRow({
  media,
  eyebrow,
  title,
  onOpen,
  excerpt,
  meta,
  actions,
  density = 'comfortable',
  className,
}: Props) {
  return (
    <div className={cn('content-row', className)} data-density={density}>
      {media && <div className="content-row-media">{media}</div>}
      <div className="content-row-body">
        {eyebrow && <div className="content-row-eyebrow">{eyebrow}</div>}
        {onOpen ? (
          <button type="button" className="content-row-title content-row-open" onClick={onOpen}>
            {title}
          </button>
        ) : (
          <div className="content-row-title">{title}</div>
        )}
        {excerpt && <p className="content-row-excerpt">{excerpt}</p>}
        {meta && <div className="content-row-meta">{meta}</div>}
      </div>
      {actions && <div className="content-row-actions">{actions}</div>}
    </div>
  )
}
