import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AdaptiveListPage } from './AdaptiveListPage'
import { Button } from '../../components/Button'

/* The promise here is the ORDER of five states. Each one is plausible on its own;
 * what breaks is the precedence, and every wrong ordering is a screen that lies:
 * "nothing here yet, create one" while the server is down, or an empty state
 * flashed at every visitor for the length of one request. */
function Page({ count, error }: { count: number | null; error?: boolean }) {
  return (
    <AdaptiveListPage
      title="Workshops"
      subtitle="Run a session"
      count={count}
      actions={<Button>New</Button>}
      cta={<Button size="lg">New</Button>}
      empty={{ icon: 'presentation', title: 'No workshops yet' }}
      error={error ? { title: 'Backend is not reachable' } : undefined}
    >
      {(gridRef) => (
        <div className="list-cluster-grid" ref={gridRef}>
          {Array.from({ length: count ?? 0 }, (_, i) => (
            <article key={i}>Item {i + 1}</article>
          ))}
        </div>
      )}
    </AdaptiveListPage>
  )
}

describe('AdaptiveListPage', () => {
  it('shows nothing while the list is still loading', () => {
    render(<Page count={null} />)
    expect(screen.queryByText('No workshops yet')).toBeNull()
    expect(screen.queryByRole('article')).toBeNull()
  })

  it('an empty list is not the same as a failed one', () => {
    const { unmount } = render(<Page count={0} />)
    expect(screen.getByText('No workshops yet')).toBeInTheDocument()
    unmount()

    /* Both are "no rows on screen"; only one of them should invite the user to
     * create their first. Telling someone to start typing while the backend is
     * down is a lie the UI tells confidently. */
    render(<Page count={0} error />)
    expect(screen.getByText('Backend is not reachable')).toBeInTheDocument()
    expect(screen.queryByText('No workshops yet')).toBeNull()
  })

  it('a failed load wins over rows that are already on screen', () => {
    render(<Page count={3} error />)
    expect(screen.getByText('Backend is not reachable')).toBeInTheDocument()
    expect(screen.queryByText('Item 1')).toBeNull()
  })

  it('keeps the header bar but drops its title while the list is empty', () => {
    /* Repeating "Workshops" directly above "No workshops yet" reads as an error.
     * The bar itself stays: an empty screen still belongs to a page. */
    render(<Page count={0} />)
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Workshops' })).toBeNull()
  })

  it('centres the empty and loading states, and stops centring once there are rows', () => {
    const { container, unmount } = render(<Page count={0} />)
    expect(container.querySelector('.adaptive-list-page')).toHaveAttribute('data-center')
    unmount()

    const { container: withRows } = render(<Page count={3} />)
    expect(withRows.querySelector('.adaptive-list-page')).not.toHaveAttribute('data-center')
  })

  it('renders the rows the caller supplies, and hands them the ref it measures', () => {
    const { container } = render(<Page count={3} />)
    expect(screen.getByText('Item 3')).toBeInTheDocument()
    /* The ref has to land on the grid or the fit measurement has nothing to
       measure and the page never leaves the welcome layout. */
    expect(container.querySelector('.list-cluster-grid')).toBeInTheDocument()
  })

  it('keeps the notice visible in every state, including the empty one', () => {
    render(
      <AdaptiveListPage
        title="Workshops"
        subtitle="Run a session"
        count={0}
        cta={<Button size="lg">New</Button>}
        empty={{ title: 'No workshops yet' }}
        notice={<p>Two boards failed to sync</p>}
      >
        {(gridRef) => <div ref={gridRef} />}
      </AdaptiveListPage>,
    )
    /* The thing it warns about does not stop being true while the list is empty. */
    expect(screen.getByText('Two boards failed to sync')).toBeInTheDocument()
    expect(screen.getByText('No workshops yet')).toBeInTheDocument()
  })

  it('a filtered-empty list keeps the header, an empty one does not', () => {
    /* The search box and the filters that emptied the screen live in the header.
     * Dropping it leaves the user with nothing to undo. */
    const { unmount } = render(
      <AdaptiveListPage
        title="Workshops"
        subtitle="Run a session"
        count={0}
        inline={<input aria-label="Search" />}
        cta={<Button size="lg">New</Button>}
        empty={{ title: 'Nothing matches', reason: 'no-matches' }}
      >
        {(gridRef) => <div ref={gridRef} />}
      </AdaptiveListPage>,
    )
    expect(screen.getByRole('heading', { name: 'Workshops' })).toBeInTheDocument()
    expect(screen.getByLabelText('Search')).toBeInTheDocument()
    unmount()

    render(<Page count={0} />)
    expect(screen.queryByRole('heading', { name: 'Workshops' })).toBeNull()
  })
})
