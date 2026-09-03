import './AdaptiveListPage.css'
import { type ReactNode, type Ref } from 'react'
import { EmptyState, type PageStateSpec } from '../../components/EmptyState'
import { ListCluster } from '../../components/ListCluster'
import { PageHeader } from '../../components/PageHeader'
import { cn } from '../../lib/cn'
import { Page } from '../Page'
import { useSimpleFit } from '../../lib/useSimpleFit'

/* Why the props look like this — kept out of the JSDoc because the registry
 * publishes that text to every agent on every task.
 *
 * `count: number | null` — `null` is "still loading", and it renders nothing
 * rather than flashing "nothing here yet, create one" at every visitor for the
 * length of one request.
 *
 * `error` separate from `empty` — a list that failed to load is not an empty
 * list, and inviting the user to create their first item while the server is
 * down is a lie the UI tells confidently.
 *
 * `notice` — a banner about the data that stays put in every state, because the
 * thing it warns about does not stop being true while the list is emptyState.
 *
 * `inline` — where a list puts its search. Only the standard layout shows it: the
 * welcome layout exists precisely because there is little enough to see without
 * searching.
 *
 * `children` as a render prop — the block owns the fit measurement and the grid
 * is what gets measured, so the caller has to be handed the ref. */
type Props = {
  /** Brand mark above the hero title, welcome layout only. See ListCluster. */
  mark?: ReactNode
  /** Hero title in the welcome layout, page title in the standard one. ReactNode: see ListCluster. */
  title: ReactNode
  /** Under the hero title, and only in the welcome layout. Optional: a heading that needs a
   *  sentence under it is usually the wrong heading, and requiring one produced screens that
   *  explained their own title back to the reader. */
  /* ReactNode: the same word means the same shape everywhere in this system,
   * and its neighbours already took one. Widened 2026-09-03; it is rendered
   * as content here, never put in an attribute. */
  subtitle?: ReactNode
  /** Header action in the standard layout. */
  actions?: ReactNode
  /** Beside the title in the header row: the list's search. */
  titleTools?: ReactNode
  /** The large call to action under the cards in the welcome layout. */
  cta: ReactNode
  /** How many items there are, or `null` while they load. */
  count: number | null
  /**
   * Shown when `count` is 0. `reason: 'no-matches'` means a filter emptied the
   * list rather than there being nothing: the header keeps its title, its search
   * and its filters, because those are what the user has to undo.
   */
  emptyState: PageStateSpec
  /** Shown instead of everything else when the list could not be loaded. */
  errorState?: PageStateSpec
  /** A banner above the list, kept in every state. */
  notice?: ReactNode
  /** The grid. Attach the ref it hands you to the grid element. */
  children: (gridRef: Ref<HTMLDivElement>) => ReactNode
  /** A class on the page, for a product that paints its own ground behind the
   *  welcome — transcript's animated wash is the case that asked for it. Every
   *  other page block already took one; this one did not, and a product moving
   *  onto it would have had to drop its background to fit (2026-08-26). */
  className?: string
}

/* Where it came from: this existed five times before it existed once — the four
 * list screens in one app and the content library in both the design system
 * and another. All five agreed on the behaviour and none of them shared a line of
 * it, which is the failure mode `npm run scout` was built to catch: the scout
 * looks BETWEEN packages, and this was repeated inside one. */

/**
 * A list page that changes shape with its contents: a centred welcome (hero
 * title, the cards, one big CTA) while everything fits on one screen, and the
 * standard header layout once it outgrows it.
 *
 * Five states, in this order because each applies only once the ones above are
 * ruled out: could not load, still loading, nothing yet, the welcome, the grid.
 *
 * Copy: the hero title welcomes and names the product; the subtitle says in one
 * sentence what a first-time reader can do here — the one place a line
 * under a title is allowed, because it IS the screen. The empty state
 * names what is missing, not that something is.
 */
export function AdaptiveListPage({ mark, title, subtitle, actions, titleTools, cta, count, emptyState, errorState, notice, children, className }: Props) {
  /* `centered` covers both "still loading" and "nothing yet": neither has a grid
   * to measure, and both belong in the middle of the page rather than under a
   * header. `simple` is the welcome layout, which only applies once there IS
   * something to show. */
  const filtered = emptyState.reason === 'no-matches'
  /* A filtered-empty list is NOT the welcome state: dropping the header would
   * take away the search box that caused it. Same rule as ListPageTemplate. */
  const centered = !filtered && (!!errorState || count === null || count === 0)
  const { fits, setGridEl, setClusterEl } = useSimpleFit(count ?? 0)
  /* Nor the welcome layout: a search that found nothing is a result, not a
     greeting. */
  const simple = !filtered && !centered && fits

  const grid = children(setGridEl)

  let content: ReactNode = null
  if (errorState) {
    content = (
      <EmptyState
        size="lg"
        surface="page"
        as="h1"
        icon={errorState.icon ?? 'error'}
        title={errorState.title}
        description={errorState.description}
        action={errorState.action}
      />
    )
  } else if (count === 0) {
    content = (
      <EmptyState
        size="lg"
        surface="page"
        /* The header keeps its title when a filter emptied the list, so this is
           only the page's h1 in the truly-empty case. */
        as={filtered ? 'h2' : 'h1'}
        icon={emptyState.icon}
        title={emptyState.title}
        description={emptyState.description}
        action={emptyState.action}
      />
    )
  } else if (simple) {
    content = (
      <ListCluster mark={mark} title={title} subtitle={subtitle} clusterRef={setClusterEl} cta={cta}>
        {grid}
      </ListCluster>
    )
  } else if (count !== null) {
    content = grid
  }

  return (
    <Page
      archetype="hub"
      className={cn('adaptive-list-page', className)}
      /* Loading and empty have nothing to put under a header, so they sit in
         the middle of the page. That is the `center` alignment <Page><Page><Page> owns. */
      align={centered ? 'center' : undefined}
      /* The welcome layout carries its own hero title, so the header bar stays
        * but empty — repeating the title directly above it reads as a mistake.
        * Same reasoning as ListPageTemplate's empty branch. */
      header={centered || simple ? <PageHeader /> : <PageHeader title={title} titleTools={titleTools} actions={actions} />}
    >
      {notice}
      {content}
    </Page>
  )
}
