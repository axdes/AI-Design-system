import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef } from 'react'
import { HoverCard } from './HoverCard'

/* A hover affordance that only answers to hover is unreachable by keyboard and
 * invisible to a screen reader. The three things worth holding: focus opens it,
 * it is announced through aria-describedby, and wrapping a trigger does not
 * steal the ref or the handlers the caller already had on it. */

const Wrapped = ({ onFocus = () => undefined, openDelay = 0 }) => (
  <HoverCard openDelay={openDelay} content={<p>Lead engineer, Berlin</p>}>
    <button onFocus={onFocus}>Ada Lovelace</button>
  </HoverCard>
)

describe('HoverCard', () => {
  /* A timed-out test cannot run its own cleanup, so restoring here is what keeps
   * one hung test from hanging every test after it. */
  afterEach(() => { vi.useRealTimers() })

  it('opens on focus, so it is reachable without a pointer', async () => {
    const user = userEvent.setup()
    render(<Wrapped />)

    await user.tab()

    expect(await screen.findByRole('tooltip')).toHaveTextContent('Lead engineer, Berlin')
  })

  it('describes the trigger only while it is open', async () => {
    const user = userEvent.setup()
    render(<Wrapped />)

    const trigger = screen.getByRole('button', { name: 'Ada Lovelace' })
    expect(trigger).not.toHaveAttribute('aria-describedby')

    await user.tab()
    const card = await screen.findByRole('tooltip')
    expect(trigger.getAttribute('aria-describedby')).toBe(card.id)

    /* AND IT GOES WHEN THE CARD GOES. The attribute is written on
       `open && position`, and the position is not cleared on close — the layer
       hook keeps the last one, because it has nothing to reset it to. So a
       widened guard leaves the trigger pointing at an element that is no longer
       in the document, which a screen reader reads as a description that is not
       there. Caught by a mutation run, 2026-08-31. */
    await user.tab()
    await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull())
    expect(trigger).not.toHaveAttribute('aria-describedby')
  })

  it('closes when focus leaves', async () => {
    const user = userEvent.setup()
    render(<Wrapped />)

    await user.tab()
    await screen.findByRole('tooltip')
    await user.tab()

    await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull())
  })

  it('opens on hover after the delay, not before', () => {
    /* fireEvent, not userEvent: userEvent's own async plumbing deadlocks against
     * fake timers, and the thing under test here is the timer itself. */
    vi.useFakeTimers()
    render(<Wrapped openDelay={200} />)

    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Ada Lovelace' }))
    act(() => { vi.advanceTimersByTime(199) })
    expect(screen.queryByRole('tooltip')).toBeNull()

    act(() => { vi.advanceTimersByTime(1) })
    expect(screen.queryByRole('tooltip')).not.toBeNull()
  })

  it('closes shortly after the pointer leaves', () => {
    vi.useFakeTimers()
    render(<Wrapped openDelay={0} />)

    const trigger = screen.getByRole('button', { name: 'Ada Lovelace' })
    fireEvent.mouseEnter(trigger)
    act(() => { vi.advanceTimersByTime(0) })
    expect(screen.queryByRole('tooltip')).not.toBeNull()

    fireEvent.mouseLeave(trigger)
    act(() => { vi.advanceTimersByTime(120) })
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('keeps the caller handler on the trigger', async () => {
    const onFocus = vi.fn()
    const user = userEvent.setup()
    render(<Wrapped onFocus={onFocus} />)

    await user.tab()

    expect(onFocus).toHaveBeenCalled()
  })

  it('keeps the caller ref on the trigger', () => {
    /* cloneElement overwrites a child's ref. Composing rather than replacing is
     * the difference between wrapping an element and quietly breaking it. */
    function Host() {
      const ref = useRef<HTMLButtonElement | null>(null)
      return (
        <>
          <HoverCard content={<p>card</p>}>
            <button ref={ref}>Ada Lovelace</button>
          </HoverCard>
          <button onClick={() => { document.title = ref.current?.textContent ?? 'empty' }}>read ref</button>
        </>
      )
    }
    render(<Host />)
    screen.getByRole('button', { name: 'read ref' }).click()

    expect(document.title).toBe('Ada Lovelace')
  })
})
