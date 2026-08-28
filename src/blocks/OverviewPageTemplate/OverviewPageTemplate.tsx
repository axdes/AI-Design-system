import './OverviewPageTemplate.css'
import { type ReactNode } from 'react'
import { Card, CardHeader, CardTitle, CardMeta } from '../../components/Card'
import { EmptyState } from '../../components/EmptyState'
import { type IconName } from '../../components/Icon'
import { Page } from '../Page'
import { cn } from '../../lib/cn'

type Props = {
  /** Page title in the header. */
  title?: ReactNode
  /**
   * Header actions. On an overview this is where freshness lives too: the
   * "updated N min ago" fact sits beside the one control that refreshes it,
   * never as a line under the title (one product's cockpit learned this twice).
   */
  actions?: ReactNode
  /**
   * Conditional page-level notices (a setup gap, unpushed work). The contract
   * that makes them safe on the busiest screen: render NOTHING when the
   * machine is healthy — a notice that is always there is one nobody reads.
   */
  notices?: ReactNode
  /**
   * The context band above the work: what period it is, what is asked by when.
   * A band, not a card — and it earns its place only if it changes with the date.
   */
  band?: ReactNode
  /**
   * Read FIRST, full-width before the grid: the two or three Stats/Meters that
   * answer the screen's primaryQuestion. About seven visual elements bound the
   * whole page.
   */
  prime?: ReactNode
  /**
   * The full-width work surface, for the overview whose centre of gravity is a
   * ranked BOARD — one card per item, reading order IS priority order — rather
   * than a widget grid. Renders after prime, before the grid, and is never
   * squeezed into the grid's columns. The cockpit case this block was
   * consolidated from; a screen passes `board` or `children`, rarely both.
   */
  board?: ReactNode
  /** The widget grid: `<OverviewWidget>` children, laid out by the template. */
  children?: ReactNode
  /** When true, the empty state is shown instead of band, prime and grid. */
  isEmpty?: boolean
  /**
   * Empty-state config. An overview has no filters, so there is only the
   * `no-data` case: a fresh install, nothing to oversee yet. The header stays —
   * its actions are usually how the first data arrives.
   */
  empty?: {
    icon?: IconName
    title: string
    description?: string
    action?: ReactNode
  }
  /** Extra class on the page wrapper, for the rare app-level difference. */
  className?: string
}

/**
 * The OVERVIEW page skeleton, read at a glance and acted on elsewhere: header
 * (freshness lives in its actions), conditional notices, a context band, a
 * prime row read first, then a grid of `<OverviewWidget>`s — zones in priority
 * order because attention is spent top to bottom.
 *
 * Copy: the title names WHOSE overview it is when a product has more than one;
 * otherwise the product's own area word. The figures under it carry their
 * period, because an overview with no period is a number with no meaning.
 */
export function OverviewPageTemplate({
  title,
  actions,
  notices,
  band,
  prime,
  board,
  children,
  isEmpty,
  empty,
  className,
}: Props) {
  return (
    <Page archetype="overview" className={cn('overview-page', className)} title={title} actions={actions}>
        {notices && <div className="overview-notices">{notices}</div>}
        {isEmpty && empty ? (
          <EmptyState
            size="lg"
            surface="page"
            /* The header kept the title, so this is a section of the page, not
               its name — h2, or the page claims to be two pages. */
            as="h2"
            icon={empty.icon}
            title={empty.title}
            description={empty.description}
            action={empty.action}
          />
        ) : (
          <>
            {band && <div className="overview-band">{band}</div>}
            {prime && <div className="overview-prime">{prime}</div>}
            {board && <div className="overview-board">{board}</div>}
            {children && <div className="overview-grid">{children}</div>}
          </>
        )}
    </Page>
  )
}

type WidgetProps = {
  /** The widget's name, one short noun phrase. */
  title: ReactNode
  /**
   * The one action in the widget's header — usually nothing: a widget is a
   * PREVIEW, and its deep page is reached through `footer`.
   */
  action?: ReactNode
  /**
   * The "View all" line, pinned to the widget's foot with its own hairline
   * (CardMeta's contract). Every widget that previews a collection carries
   * one: a preview with no way to the whole is a dead end.
   */
  footer?: ReactNode
  /** Stretch across the whole grid — for the one widget that is the screen's centre of gravity. */
  wide?: boolean
  children?: ReactNode
  className?: string
}

/**
 * One widget on an overview: a Card with the shared anatomy — title, preview
 * content, an optional "view all" foot. The anatomy is fixed so a grid of
 * widgets reads as one surface; what varies is only the content.
 */
export function OverviewWidget({ title, action, footer, wide, children, className }: WidgetProps) {
  return (
    <Card fill className={cn('overview-widget', className)} data-wide={wide || undefined}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {action}
      </CardHeader>
      <div className="overview-widget-body">{children}</div>
      {footer && <CardMeta>{footer}</CardMeta>}
    </Card>
  )
}
