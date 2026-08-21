import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChatMessage } from './ChatMessage'

/* Two shapes in one component: a user bubble with nothing on it, and an
 * assistant row carrying a toolbar of toggles. The toggles are the part worth
 * holding — a pressed state that is only a CSS class is invisible to a screen
 * reader, and a copy button that never returns to "copy" strands the user. */

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })

const assistant = (props: Partial<Parameters<typeof ChatMessage>[0]> = {}) => (
  <ChatMessage role="assistant" text="The answer is 42." {...props}>
    <p>The answer is 42.</p>
  </ChatMessage>
)

describe('ChatMessage', () => {
  it('gives a user message no toolbar at all', () => {
    render(<ChatMessage role="user"><p>What is the answer?</p></ChatMessage>)

    expect(screen.getByText('What is the answer?')).toBeInTheDocument()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('can have its toolbar suppressed', () => {
    render(assistant({ hideActions: true }))
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('announces thumbs up as pressed, not merely coloured', async () => {
    const user = userEvent.setup()
    render(assistant())

    const up = screen.getByRole('button', { name: 'Good response' })
    expect(up).toHaveAttribute('aria-pressed', 'false')

    await user.click(up)
    expect(up).toHaveAttribute('aria-pressed', 'true')
  })

  it('holds one vote at a time', async () => {
    const user = userEvent.setup()
    render(assistant())

    const [up, down] = [
      screen.getByRole('button', { name: 'Good response' }),
      screen.getByRole('button', { name: 'Bad response' }),
    ]
    await user.click(up)
    await user.click(down)

    expect(up).toHaveAttribute('aria-pressed', 'false')
    expect(down).toHaveAttribute('aria-pressed', 'true')
  })

  it('un-votes when the same thumb is pressed again', async () => {
    const user = userEvent.setup()
    render(assistant())

    const up = screen.getByRole('button', { name: 'Good response' })
    await user.click(up)
    await user.click(up)

    expect(up).toHaveAttribute('aria-pressed', 'false')
  })

  it('opens the feedback flow on the first thumbs-down only', async () => {
    const onDislike = vi.fn()
    const user = userEvent.setup()
    render(assistant({ onDislike }))

    const down = screen.getByRole('button', { name: 'Bad response' })
    await user.click(down)
    expect(onDislike).toHaveBeenCalledTimes(1)

    /* Pressing it again un-votes; re-opening the dialog there would be a loop. */
    await user.click(down)
    expect(onDislike).toHaveBeenCalledTimes(1)
  })

  it('puts the message on the clipboard', async () => {
    /* jsdom's navigator.clipboard cannot be redefined, but userEvent installs a
     * working stub — so this reads the clipboard rather than spying on the call.
     * Real timers here: that stub deadlocks against fake ones. */
    const user = userEvent.setup()
    render(assistant())

    await user.click(screen.getByRole('button', { name: 'Copy' }))

    expect(await navigator.clipboard.readText()).toBe('The answer is 42.')
  })

  it('says "Copied" and goes back on its own', () => {
    vi.useFakeTimers()
    render(assistant())

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }))
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument()

    /* Without the reset the button reads "Copied" for the rest of the session. */
    act(() => { vi.advanceTimersByTime(1500) })
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument()
  })

  it('offers quick replies and hands the click back', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(assistant({ choices: [{ label: 'Tell me more', onClick }] }))

    await user.click(screen.getByRole('button', { name: 'Tell me more' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
