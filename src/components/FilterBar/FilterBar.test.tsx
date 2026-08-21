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
})
