import './Timeline.css'
import { type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { Icon, type IconName } from '../Icon'

type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger'

export type TimelineItem = {
  id: string
  /** Headline of the event. */
  title: ReactNode
  /** When it happened (already formatted). */
  time?: ReactNode
  /** Optional body under the title. */
  content?: ReactNode
  /** Icon in the node marker; defaults to a filled dot. */
  icon?: IconName
  tone?: Tone
}

type Props = {
  items: TimelineItem[]
  className?: string
}

/* A vertical sequence of events joined by a connecting line — an audit trail, a
 * delivery history, a changelog. Each node is a marker (dot or icon) with a
 * title, an optional time and body. Presentational; the caller orders the items
 * and formats the times. */
export function Timeline({ items, className }: Props) {
  return (
    <ol className={cn('timeline', className)}>
      {items.map((item) => (
        <li className="timeline-item" key={item.id}>
          <span className="timeline-marker" data-tone={item.tone ?? 'neutral'} aria-hidden="true">
            {item.icon ? <Icon name={item.icon} size="sm" /> : <span className="timeline-dot" />}
          </span>
          <div className="timeline-body">
            <div className="timeline-head">
              <span className="timeline-title">{item.title}</span>
              {item.time && <span className="timeline-time">{item.time}</span>}
            </div>
            {item.content && <div className="timeline-content">{item.content}</div>}
          </div>
        </li>
      ))}
    </ol>
  )
}
