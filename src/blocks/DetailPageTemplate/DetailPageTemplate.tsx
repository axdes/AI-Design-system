import './DetailPageTemplate.css'
import { useState, type ReactNode } from 'react'
import { IconButton } from '../../components/IconButton'
import { PageHeader } from '../../components/PageHeader'
import { SidePanel } from '../../components/SidePanel'
import { Tooltip } from '../../components/Tooltip'

type Props = {
  /** Detail title in the header. ReactNode, like PageHeader's own title: a
   *  record title routinely carries a status <Badge> or a <Tag> beside it, and
   *  typing this as string only forced callers to fake it elsewhere. */
  title: ReactNode
  /** Back handler for the header. */
  onBack?: () => void
  /** Accessible name for the back control (defaults inside PageHeader). */
  backLabel?: string
  /** Header actions (edit / delete / …). */
  actions?: ReactNode
  /** The main content (sections, cards, tabs). */
  children: ReactNode
  /**
   * Optional right-hand side panel (metadata, related items).
   *
   * `collapsible` folds it to a narrow rail with one control to bring it back. Use it when the
   * panel is long enough that a reader working in the main column wants the width instead — the
   * panel is context, and context the reader has finished with should not go on taking a fifth
   * of the page.
   */
  aside?: { title: string; content: ReactNode; collapsible?: boolean; defaultCollapsed?: boolean }
  /**
   * Put each column on its own white card, fill the height, and let each one scroll on its own.
   *
   * Off by default: a record page that is read top to bottom wants the page to scroll, and two
   * independently scrolling boxes are worse for that. Turn it on when the two columns are read
   * side by side and against each other — a match score next to what it was measured against —
   * where scrolling one to reach the bottom of the other is the thing that gets in the way.
   * The app shell has to release its height for this; see `.app-layout:has([data-panels])`.
   */
  panels?: boolean
}

/**
 * The DETAIL page skeleton: a header with back + actions, then a main content
 * column and an optional right SidePanel for metadata/related items. Structure
 * only; the caller fills the columns with DS components. A page-template block the
 * discovery picks for record/detail screens.
 */
export function DetailPageTemplate({ title, onBack, backLabel, actions, children, aside, panels }: Props) {
  const [asideCollapsed, setAsideCollapsed] = useState(aside?.defaultCollapsed ?? false)
  const collapsed = !!aside?.collapsible && asideCollapsed

  return (
    <>
      <PageHeader title={title} onBack={onBack} backLabel={backLabel} actions={actions} />
      <div className="detail-page" data-has-aside={aside ? '' : undefined} data-panels={panels || undefined}>
        <div className="detail-page-main">{children}</div>
        {aside && (collapsed ? (
          /* Collapsed: a rail the width of one control, and the control says what it opens. The
             panel is NOT removed from the page — a reader who folded it away still needs to see
             that there is something there, or the width just silently changed. */
          <div className="detail-page-aside-rail">
            <Tooltip content={aside.title} placement="start">
              <IconButton
                icon="arrow_left_to_line"
                size="md"
                aria-label={`Show ${aside.title}`}
                aria-expanded={false}
                onClick={() => setAsideCollapsed(false)}
              />
            </Tooltip>
          </div>
        ) : (
          <SidePanel
            title={aside.title}
            className="detail-page-aside"
            headerActions={aside.collapsible && (
              <Tooltip content="Collapse">
                <IconButton
                  icon="arrow_right_to_line"
                  size="md"
                  aria-label={`Collapse ${aside.title}`}
                  aria-expanded
                  onClick={() => setAsideCollapsed(true)}
                />
              </Tooltip>
            )}
          >
            {aside.content}
          </SidePanel>
        ))}
      </div>
    </>
  )
}
