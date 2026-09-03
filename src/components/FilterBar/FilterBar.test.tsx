import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FilterBar } from './FilterBar'

/* This component has two entirely different shapes depending on the viewport:
 * inline controls on desktop, a button that opens a sheet below 48rem. Only one
 * of them is ever on screen, so a visual baseline can only ever prove one. */

const setViewport = (mobile: boolean) => {
  window.matchMedia = ((query: string) => ({
    matches: mobile && query.includes('max-width'),
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}

afterEach(() => { setViewport(false) })

describe('FilterBar', () => {
  it('desktop: shows the filters themselves, with no trigger in the way', () => {
    setViewport(false)
    render(<FilterBar activeCount={0} onClear={() => undefined}><button>Owner</button></FilterBar>)

    expect(screen.getByRole('button', { name: 'Owner' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /filters/i })).toBeNull()
  })

  it('mobile: collapses the filters behind a trigger', () => {
    setViewport(true)
    render(<FilterBar activeCount={0} onClear={() => undefined}><button>Owner</button></FilterBar>)

    expect(screen.getByRole('button', { name: /filters/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Owner' })).toBeNull()
  })

  it('mobile: the trigger opens a sheet holding the same filters', async () => {
    setViewport(true)
    const user = userEvent.setup()
    render(<FilterBar activeCount={0} onClear={() => undefined}><button>Owner</button></FilterBar>)

    await user.click(screen.getByRole('button', { name: /filters/i }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Owner' })).toBeInTheDocument()
  })

  it('mobile: shows how many filters are on', () => {
    setViewport(true)
    render(<FilterBar activeCount={3} onClear={() => undefined}><button>Owner</button></FilterBar>)

    /* Without this the trigger hides the fact that a list is filtered at all. */
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('mobile: "clear all" is dead while nothing is filtered', async () => {
    setViewport(true)
    const user = userEvent.setup()
    render(<FilterBar activeCount={0} onClear={() => undefined}><button>Owner</button></FilterBar>)

    await user.click(screen.getByRole('button', { name: /filters/i }))
    expect(screen.getByRole('button', { name: /clear all/i })).toBeDisabled()
  })

  it('mobile: clears through the caller', async () => {
    setViewport(true)
    const onClear = vi.fn()
    const user = userEvent.setup()
    render(<FilterBar activeCount={2} onClear={onClear}><button>Owner</button></FilterBar>)

    await user.click(screen.getByRole('button', { name: /filters/i }))
    await user.click(screen.getByRole('button', { name: /clear all/i }))

    expect(onClear).toHaveBeenCalledTimes(1)
  })

  it('mobile: closing the panel needs no confirm — filters apply live, so Close is the only way out', async () => {
    setViewport(true)
    const user = userEvent.setup()
    render(<FilterBar activeCount={0} onClear={() => undefined}><button>Owner</button></FilterBar>)

    await user.click(screen.getByRole('button', { name: /filters/i }))
    /* No "done" button any more: it was only a second Close. */
    expect(screen.queryByRole('button', { name: /done/i })).toBeNull()
    await user.click(screen.getByRole('button', { name: /close/i }))

    expect(screen.queryByRole('dialog')).toBeNull()
  })

  /* THE TRIGGER IS ONLY "ACTIVE" WHEN A FILTER IS ON. `activeCount > 0` is what
     that means; widened to `>= 0` the trigger is marked active on a bar where
     nothing is filtered, so the one signal that says "you are not seeing
     everything" says it always and stops meaning anything. A mutation run
     widened it and nothing failed (2026-08-29). */
  it('mobile: marks the trigger active only when a filter is on', () => {
    setViewport(true)
    const { unmount } = render(<FilterBar activeCount={0} onClear={() => undefined}><button>Owner</button></FilterBar>)
    expect(screen.getByRole('button', { name: /filters/i })).not.toHaveAttribute('data-active')
    unmount()

    render(<FilterBar activeCount={2} onClear={() => undefined}><button>Owner</button></FilterBar>)
    expect(screen.getByRole('button', { name: /filters/i })).toHaveAttribute('data-active')
  })

  /* `collapsed` is the desktop screen ASKING for the mobile shape: a toolbar
     with no room of its own folds its filters into the sheet, the same one the
     phone gets, rather than pushing them onto a second row. */
  it('folds into the sheet on a wide screen when the caller asks it to', async () => {
    const user = userEvent.setup()
    render(<FilterBar activeCount={0} onClear={() => undefined} collapsed><button>Owner</button></FilterBar>)
    const trigger = screen.getByRole('button', { name: /filter/i })
    expect(screen.queryByRole('button', { name: 'Owner' })).toBeNull()
    await user.click(trigger)
    expect(screen.getByRole('button', { name: 'Owner' })).toBeInTheDocument()
  })
})
