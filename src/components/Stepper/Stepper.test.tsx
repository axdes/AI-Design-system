import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Stepper } from './Stepper'

const STEPS = [
  { label: 'Account' },
  { label: 'Shipping' },
  { label: 'Payment' },
  { label: 'Review' },
]

describe('Stepper', () => {
  it('marks the current step and derives complete/upcoming from it', () => {
    render(<Stepper steps={STEPS} currentIndex={2} label="Checkout" />)
    const items = screen.getByRole('list', { name: 'Checkout' }).querySelectorAll('li')

    expect(items[0]).toHaveAttribute('data-state', 'complete')
    expect(items[1]).toHaveAttribute('data-state', 'complete')
    expect(items[2]).toHaveAttribute('data-state', 'current')
    expect(items[2]).toHaveAttribute('aria-current', 'step')
    expect(items[3]).toHaveAttribute('data-state', 'upcoming')
  })

  it('lets you click back to a completed step only', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<Stepper steps={STEPS} currentIndex={2} onSelect={onSelect} />)

    /* Completed steps render as buttons; current and upcoming ones do not. */
    await user.click(screen.getByRole('button', { name: /Account/ }))
    expect(onSelect).toHaveBeenCalledWith(0)

    expect(screen.queryByRole('button', { name: /Review/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /Payment/ })).toBeNull()
  })

  it('is inert without onSelect', () => {
    render(<Stepper steps={STEPS} currentIndex={2} />)
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })
})
