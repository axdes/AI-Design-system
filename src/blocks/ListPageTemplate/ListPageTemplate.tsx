import './ListPageTemplate.css'
import { type ReactNode } from 'react'
import { EmptyState, type PageStateSpec } from '../../components/EmptyState'
import { PageHeader } from '../../components/PageHeader'
import { Page } from '../Page'
import { cn } from '../../lib/cn'

/* Monolithic because its props are the zones of a list screen and the empty
 * state that replaces them. `panels` and `contentClassName` are what the
 * SHELL and the screen's own layout need from it; neither is a part a caller
 * could compose. */
type Props = {
  /**
   * Page title in the header. Optional because a screen that is only ever emptyState
   * has none: the emptyState state carries the words, and repeating them above it
   * reads as an error. `PlaceholderPage` is exactly that screen.
   */
  title?: ReactNode
  /** Header actions (e.g. a "New" button). */
  actions?: ReactNode
  /**
   * Content placed INSIDE the header row, beside the title. Where a list screen
   * puts its search: two of the real ones already do it that way, and without
   * this the only option was a toolbar on its own line below.
   */
  titleTools?: ReactNode
  /** Optional toolbar under the header (a FilterBar / a row of filters). */
  toolbar?: ReactNode
  /** The list / grid content the caller supplies, with its own layout. Optional
   *  for the same reason as `title`: an always-emptyState screen has no list. */
  children?: ReactNode
  /** When true, the emptyState state is shown instead of the content. */
  isEmpty?: boolean
  /**
   * Empty-state config, shown when isEmpty.
   *
   * `reason` decides what happens to the header, and it matters more than it
   * looks. `no-data` (the default) drops the title: repeating "Users" above
   * "no users yet" reads as an error, which is what the hand-written screens
   * already did. `no-matches` keeps the whole header, because the search box and
   * the filters that caused the emptiness are IN it — dropping them leaves the
   * user with an emptyState screen and nothing to undo it with.
   */
  emptyState?: PageStateSpec
  /**
   * Extra class on the content wrapper. A list screen decides its own layout (a
   * card grid, one reading column, a table), so the template does not impose
   * one; this is where the caller's layout class goes.
   */
  contentClassName?: string
  /**
   * Extra class on the page wrapper, for the rare app-level difference. One app's
   * shell makes this element the scroll container, for instance.
   */
  className?: string
  /**
   * Panelled list: the page stops scrolling and the content region takes the
   * leftover height, so whatever the caller puts there (typically a
   * `<Card flush>` around a `<TableScroll>`) scrolls inside itself while the
   * header and the toolbar stay put. Pair it with `<Table stickyHeader>` so the
   * column names survive the scroll. Desktop only — stacked full-height
   * scrollers on a phone make the bottom one unreachable, so below the shell's
   * panel breakpoint the page scrolls normally.
   *
   * The app shell has to release its height for this; see
   * `.app-layout:has([data-panels])` — the same contract DetailPageTemplate's
   * `panels` uses.
   */
  panels?: boolean
}

/* It owns its page wrapper rather than borrowing the app's `.page-content`: that
 * class is declared separately in each app, and a block cannot depend on a
 * stylesheet it does not import. ListPageTemplate.css has the two earlier
 * attempts and why they failed. */

/**
 * The LIST page skeleton, the most common product screen: a header (title +
 * actions), an optional toolbar, then either the content or an emptyState state.
 *
 * Copy: the title is the collection in the plural, in the reader's word for it —
 * "Invoices", not "Invoice list". The emptyState state names what is missing
 * and what would fill it.
 */
export function ListPageTemplate({
  title,
  actions,
  titleTools,
  toolbar,
  children,
  isEmpty,
  emptyState,
  contentClassName,
  className,
  panels,
}: Props) {
  if (isEmpty && emptyState) {
    const filtered = emptyState.reason === 'no-matches'
    return (
      <Page
        archetype="list"
        className={cn('list-page', className)}
        /* `data-panels` stays on through the emptyState state: the shell keys its
          * height release on the attribute, and dropping it the moment a filter
          * matches nothing would bounce the whole layout under the user's
          * pointer. */
        panels={panels}
        /* An emptyState state centred in the leftover height pushes the controls to
          * the top of a tall blank page and reads as a toolbar belonging to
          * nothing, so a filtered-emptyState screen that kept its toolbar starts at
          * the top like any other. */
        align={filtered && toolbar ? undefined : 'center'}
        /* Nothing here yet: the header bar stays, without its title, because an
          * emptyState screen still belongs to a page but repeating the title above
          * "nothing yet" reads as an error. Nothing MATCHES: the full header
          * stays, since the search and filters that emptied the screen live in
          * it and removing them would trap the user. */
        header={filtered
          ? <PageHeader title={title} titleTools={titleTools} actions={actions} />
          : <PageHeader />}
        /* And the TOOLBAR stays too, for exactly the same reason the header does.
          * It did not, and a screen whose search lives in the toolbar rather than in the
          * header slot lost its search box the moment a query matched nothing: the user
          * typed one letter too many and the field they were typing into disappeared. */
        toolbar={filtered && toolbar ? toolbar : undefined}
      >
          <EmptyState
            size="lg"
            surface="page"
            /* When the header carries no title, this IS the page's name, so it
               has to be the h1: a screen with no h1 gives a screen reader
               nothing to announce it by. When the emptiness is a filter result
               the header kept its title, and a second h1 would claim there are
               two pages here. */
            as={filtered ? 'h2' : 'h1'}
            icon={emptyState.icon}
            title={emptyState.title}
            description={emptyState.description}
            action={emptyState.action}
          />
      </Page>
    )
  }

  return (
    <Page
      archetype="list"
      className={cn('list-page', className)}
      panels={panels}
      title={title}
      titleTools={titleTools}
      actions={actions}
      toolbar={toolbar}
    >
      <div className={cn('list-page-content', contentClassName)}>{children}</div>
    </Page>
  )
}
