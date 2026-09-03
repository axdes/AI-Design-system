import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SessionPill } from './SessionPill'

/* A live session, floating over whatever the person is doing. It is the one
 * component in the system that persists across screens, so the two things it
 * owes are that its body is one button and that it can be got rid of. */

describe('SessionPill', () => {
  it('is one button carrying the whole label, so a tap anywhere on it goes back', async () => {
    const onClick = vi.fn()
    render(<SessionPill label="Call with Northwind" timer="12:04" onClick={onClick} />)
    const pill = screen.getByRole('button', { name: /Call with Northwind/ })
    expect(pill).toHaveTextContent('12:04')

    await userEvent.click(pill)
    expect(onClick).toHaveBeenCalledOnce()
  })

  /* Dismissal is a SECOND control, and it only exists when somebody can act on
   * it: a close button that does nothing is worse than none. */
  it('offers a way out only when there is somewhere for it to go', async () => {
    const onDismiss = vi.fn()
    const { rerender } = render(<SessionPill label="Call" onClick={() => {}} />)
    expect(screen.getAllByRole('button')).toHaveLength(1)

    rerender(<SessionPill label="Call" onClick={() => {}} onDismiss={onDismiss} dismissLabel="End call" />)
    await userEvent.click(screen.getByRole('button', { name: 'End call' }))
    expect(onDismiss).toHaveBeenCalledOnce()
  })
})
