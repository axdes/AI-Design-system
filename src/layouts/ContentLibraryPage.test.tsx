import { describe, expect, it } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { renderScreen } from '@/test/renderScreen'

/* jsdom measures no heights, so the adaptive fit always says "fits" and the
 * page would sit in its welcome mode forever. These behaviours are about the
 * STANDARD library (toolbar, search, grid), so the fit is pinned to false —
 * the hook's own contract is a separate concern. */
vi.mock('@/lib/useSimpleFit', () => ({
  useSimpleFit: () => ({ fits: false, setGridEl: () => undefined, setClusterEl: () => undefined }),
}))
import { ContentLibraryPage } from './ContentLibraryPage'

describe('documents-list behaviours', () => {
  it('documents-list#my-content-shows-only-mine — the library is the signed-in author\'s own work', () => {
    renderScreen(<ContentLibraryPage />, { userId: 'u1' })
    /* u1 (Mohammed) authored fixtures; u3's pieces must not appear. */
    expect(screen.getByText('Leadership Welcome Message')).toBeInTheDocument()
    expect(screen.queryByText('Community Outreach Newsletter')).not.toBeInTheDocument()
  })

  it('documents-list#search-narrows-by-title — typing narrows the grid to matching titles', () => {
    renderScreen(<ContentLibraryPage />, { userId: 'u1' })
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Leadership' } })
    expect(screen.getByText('Leadership Welcome Message')).toBeInTheDocument()
    expect(screen.queryByText('Safety Protocol Update')).not.toBeInTheDocument()
  })

  it('documents-list#empty-search-offers-the-way-back — a search with no hits explains itself instead of a blank grid', () => {
    renderScreen(<ContentLibraryPage />, { userId: 'u1' })
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zzz-no-such-title' } })
    expect(screen.queryByText('Leadership Welcome Message')).not.toBeInTheDocument()
    /* The empty state names the situation; the exact copy is the screen's own. */
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
  })
})
