import './AdaptiveListPage.css'
import { type ReactNode, type Ref } from 'react'
import { EmptyState } from '../../components/EmptyState'
import { type IconName } from '../../components/Icon'
import { ListCluster } from '../../components/ListCluster'
import { PageHeader } from '../../components/PageHeader'
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
 * thing it warns about does not stop being true while the list is empty.
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
  subtitle?: string
  /** Header action in the standard layout. */
  actions?: ReactNode
  /** Beside the title in the header row: the list's search. */
  inline?: ReactNode
  /** The large call to action under the cards in the welcome layout. */
  cta: ReactNode
  /** How many items there are, or `null` while they load. */
  count: number | null
  /**
   * Shown when `count` is 0. `reason: 'no-matches'` means a filter emptied the
   * list rather than there being nothing: the header keeps its title, its search
   * and its filters, because those are what the user has to undo.
   */
  empty: {
    icon?: IconName
    title: string
    description?: string
    action?: ReactNode
    reason?: 'no-data' | 'no-matches'
  }
  /** Shown instead of everything else when the list could not be loaded. */
  error?: { icon?: IconName; title: string; description?: string; action?: ReactNode }
  /** A banner above the list, kept in every state. */
  notice?: ReactNode
  /** The grid. Attach the ref it hands you to the grid element. */
  children: (gridRef: Ref<HTMLDivElement>) => ReactNode
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
 */
export function AdaptiveListPage({ mark, title, subtitle, actions, inline, cta, count, empty, error, notice, children }: Props) {
  /* `centered` covers both "still loading" and "nothing yet": neither has a grid
   * to measure, and both belong in the middle of the page rather than under a
   * header. `simple` is the welcome layout, which only applies once there IS
   * something to show. */
  const filtered = empty.reason === 'no-matches'
  /* A filtered-empty list is NOT the welcome state: dropping the header would
   * take away the search box that caused it. Same rule as ListPageTemplate. */
  const centered = !filtered && (!!error || count === null || count === 0)
  const { fits, setGridEl, setClusterEl } = useSimpleFit(count ?? 0)
  /* Nor the welcome layout: a search that found nothing is a result, not a
     greeting. */
  const simple = !filtered && !centered && fits

  const grid = children(setGridEl)

  let content: ReactNode = null
  if (error) {
    content = (
      <EmptyState
        size="lg"
        surface="page"
        as="h1"
        icon={error.icon ?? 'error'}
        title={error.title}
        description={error.description}
        action={error.action}
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
        icon={empty.icon}
        title={empty.title}
        description={empty.description}
        action={empty.action}
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
    <>
      {/* The welcome layout carries its own hero title, so the header bar stays
        * but empty — repeating the title directly above it reads as a mistake.
        * Same reasoning as ListPageTemplate's empty branch. */}
      {centered || simple ? <PageHeader /> : <PageHeader title={title} inline={inline} actions={actions} />}
      <div className="adaptive-list-page" data-center={centered || undefined}>
        {notice}
        {content}
      </div>
    </>
  )
}
