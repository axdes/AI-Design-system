import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef } from 'react'
import { Chip } from './Chip'

/* A chip is a toggle that looks like a label. The looking-like-a-label half is
 * the example's job; the toggle half is this one, and `aria-pressed` is the only
 * part of it a screen reader ever sees. */

describe('Chip', () => {
  it('announces its toggle state, pressed and not', () => {
    const { rerender } = render(<Chip selected={false}>Unclear</Chip>)
    expect(screen.getByRole('button', { name: 'Unclear' })).toHaveAttribute('aria-pressed', 'false')

    rerender(<Chip selected>Unclear</Chip>)
    expect(screen.getByRole('button', { name: 'Unclear' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('is a plain button when it is not a toggle at all', () => {
    /* Chips are also quick replies and one-shot actions. Announcing those as
     * unpressed toggle buttons would be worse than saying nothing, so the
     * attribute appears only once the caller opts into a toggle. */
    render(<Chip>Tell me more</Chip>)
    expect(screen.getByRole('button', { name: 'Tell me more' })).not.toHaveAttribute('aria-pressed')
  })

  it('does not submit the form it sits in unless asked', () => {
    render(<Chip>Filter</Chip>)
    expect(screen.getByRole('button', { name: 'Filter' })).toHaveAttribute('type', 'button')
  })

  it('fires on click and on Enter', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(<Chip onClick={onClick}>Filter</Chip>)

    const chip = screen.getByRole('button', { name: 'Filter' })
    await user.click(chip)
    chip.focus()
    await user.keyboard('{Enter}')

    expect(onClick).toHaveBeenCalledTimes(2)
  })

  it('honours disabled', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(<Chip disabled onClick={onClick}>Filter</Chip>)

    await user.click(screen.getByRole('button', { name: 'Filter' }))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('keeps its icon out of the accessible name', () => {
    render(<Chip icon="check">Done</Chip>)
    expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument()
  })

  it('hands the caller a ref to the real button', () => {
    function Host() {
      const ref = useRef<HTMLButtonElement | null>(null)
      return (
        <>
          <Chip ref={ref}>Filter</Chip>
          <button onClick={() => ref.current?.focus()}>focus it</button>
        </>
      )
    }
    render(<Host />)
    screen.getByRole('button', { name: 'focus it' }).click()

    expect(screen.getByRole('button', { name: 'Filter' })).toHaveFocus()
  })
})
