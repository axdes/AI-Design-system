import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoadMore } from './LoadMore'

/* The two things a hand-rolled infinite scroll gets wrong: it keeps asking while
 * the fetch is still in flight, and it has no control at all, so a keyboard user
 * never reaches the rest of the list. */

type Cb = (entries: { isIntersecting: boolean }[]) => void
let fire: Cb = (_entries) => undefined

function stubObserver() {
  const disconnect = vi.fn()
  vi.stubGlobal('IntersectionObserver', class {
    constructor(cb: Cb) { fire = cb }
    observe() { /* the anchor is always the one element */ }
    disconnect = disconnect
  })
  return { disconnect }
}

afterEach(() => { vi.unstubAllGlobals() })

describe('LoadMore', () => {
  it('renders nothing once there is no more', () => {
    const { container } = render(<LoadMore hasMore={false} label="Load more" onLoad={() => undefined} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('is a real button, not only a scroll trigger', async () => {
    const onLoad = vi.fn()
    const user = userEvent.setup()
    render(<LoadMore hasMore label="Load more" onLoad={onLoad} />)

    await user.click(screen.getByRole('button', { name: 'Load more' }))
    expect(onLoad).toHaveBeenCalledTimes(1)
  })

  it('shows the fetch in flight and blocks a second click', async () => {
    const onLoad = vi.fn()
    const user = userEvent.setup()
    render(<LoadMore hasMore loading label="Load more" onLoad={onLoad} />)

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')

    await user.click(button)
    expect(onLoad).not.toHaveBeenCalled()
  })

  it('loads on intersection when auto', () => {
    stubObserver()
    const onLoad = vi.fn()
    render(<LoadMore auto hasMore label="Load more" onLoad={onLoad} />)

    fire([{ isIntersecting: true }])
    expect(onLoad).toHaveBeenCalledTimes(1)
  })

  it('does not ask again while a fetch is in flight', () => {
    stubObserver()
    const onLoad = vi.fn()
    const { rerender } = render(<LoadMore auto hasMore label="Load more" onLoad={onLoad} />)

    fire([{ isIntersecting: true }])
    rerender(<LoadMore auto hasMore loading label="Load more" onLoad={onLoad} />)
    fire([{ isIntersecting: true }])

    expect(onLoad).toHaveBeenCalledTimes(1)
  })

  it('ignores an intersection that is leaving the viewport', () => {
    stubObserver()
    const onLoad = vi.fn()
    render(<LoadMore auto hasMore label="Load more" onLoad={onLoad} />)

    fire([{ isIntersecting: false }])
    expect(onLoad).not.toHaveBeenCalled()
  })
})
