import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { CharacterCount } from './CharacterCount'

/* Two copies of one fact, and the whole point is that they are not in sync: the
 * visible one is instant and hidden from assistive tech, the announced one
 * waits for a pause so a screen reader does not read a number after every
 * letter. A test is the only thing that can see the difference. */

describe('CharacterCount', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('states what is left of the budget', () => {
    render(<CharacterCount value="four" max={10} />)
    expect(screen.getAllByText('6 characters remaining').length).toBeGreaterThan(0)
  })

  it('turns into an over-budget count past the limit', () => {
    render(<CharacterCount value="0123456789ab" max={10} />)
    expect(screen.getAllByText('2 characters too many').length).toBeGreaterThan(0)
  })

  it('holds the announcement back until typing stops', () => {
    const { rerender } = render(<CharacterCount value="" max={10} />)
    const live = screen.getByRole('status')
    expect(live).toHaveTextContent('10 characters remaining')

    rerender(<CharacterCount value="typed" max={10} />)
    /* Mid-keystroke: the visible copy has already moved on, the announced one
     * has not, which is what keeps the screen reader quiet while typing. */
    expect(live).toHaveTextContent('10 characters remaining')

    /* `act`, because the timer's setState is a React update outside an event. */
    act(() => { vi.advanceTimersByTime(1000) })
    expect(live).toHaveTextContent('5 characters remaining')
  })
})
