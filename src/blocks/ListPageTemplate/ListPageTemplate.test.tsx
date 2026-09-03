import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ListPageTemplate } from './ListPageTemplate'

/* A page of things. Its one decision is what to show when there are none, and
 * the decision has two answers that must not be confused: nothing has been
 * created yet, and nothing MATCHED — the first offers a way to start, the
 * second offers a way back to everything. */

const page = (props: Partial<Parameters<typeof ListPageTemplate>[0]> = {}) =>
  render(
    <MemoryRouter>
      <ListPageTemplate title="Sessions" {...props}>
        <div>the rows</div>
      </ListPageTemplate>
    </MemoryRouter>,
  )

describe('ListPageTemplate', () => {
  it('shows the things when there are things', () => {
    page()
    expect(screen.getByText('the rows')).toBeInTheDocument()
  })

  it('shows the empty state instead of the rows when there is nothing', () => {
    page({ isEmpty: true, emptyState: { title: 'No sessions yet' } })
    expect(screen.getByText('No sessions yet')).toBeInTheDocument()
    expect(screen.queryByText('the rows')).not.toBeInTheDocument()
  })

  /* A filter that matched nothing is not an empty product, and the toolbar has
   * to stay: taking away the filters leaves the reader with no way to undo the
   * thing that emptied the page. */
  it('keeps the toolbar when a filter is what emptied the page', () => {
    page({
      isEmpty: true,
      emptyState: { title: 'Nothing matches', reason: 'no-matches' },
      toolbar: <div>the filters</div>,
    })
    expect(screen.getByText('the filters')).toBeInTheDocument()
    expect(screen.getByText('Nothing matches')).toBeInTheDocument()
  })

  it('names the page once', () => {
    page()
    expect(screen.getByRole('heading', { level: 1, name: 'Sessions' })).toBeInTheDocument()
  })

  /* `panels` is what the app shell keys its height off, and it stays on through
     the empty state — a page that scrolls its own panel must not start
     scrolling the window the moment the list is empty. `contentClassName` is
     where the screen's own layout goes. */
  it('declares its panels to the shell and carries the screen’s layout class', () => {
    const { container } = render(
      <MemoryRouter>
        <ListPageTemplate title="Sessions" panels contentClassName="session-grid">
          <div>the rows</div>
        </ListPageTemplate>
      </MemoryRouter>,
    )
    expect(container.querySelector('[data-panels]')).toBeInTheDocument()
    expect(container.querySelector('.list-page-content')).toHaveClass('session-grid')
  })
})
