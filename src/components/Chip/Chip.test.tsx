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

/* THE OTHER HALF OF THE SAME PILL. <Tag> was folded in on 2026-08-30, and the
 * thing worth testing about a data token is everything it must NOT do: it is not
 * a button, it cannot be pressed, and nothing about it invites a click. Only the
 * X does anything. */
describe('Chip, as data', () => {
  it('is not a control: no button, no pressed state', () => {
    render(<Chip interactive={false} selected>Internal</Chip>)
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByText('Internal').closest('.chip')).not.toHaveAttribute('aria-pressed')
  })

  it('becomes data as soon as it is removable — a button inside a button is invalid HTML', () => {
    render(<Chip onRemove={() => undefined} removeLabel="Remove Sarah">Sarah</Chip>)
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(1)
    expect(buttons[0]).toHaveAccessibleName('Remove Sarah')
  })

  it('removes the one token it names', async () => {
    const onRemove = vi.fn()
    const user = userEvent.setup()
    render(<Chip onRemove={onRemove} removeLabel="Remove Ahmed">Ahmed</Chip>)

    await user.click(screen.getByRole('button', { name: 'Remove Ahmed' }))
    expect(onRemove).toHaveBeenCalledTimes(1)
  })

  it('carries what the caller puts on it, the same as the control does', () => {
    /* Both branches spread the rest: an `aria-describedby` from elsewhere on the
     * page, a `title`, a `data-*` hook. Dropping either spread silently strips
     * every one of them. */
    render(<Chip interactive={false} title="Internal only" data-testid="token">Internal</Chip>)
    const token = screen.getByTestId('token')
    expect(token).toHaveAttribute('title', 'Internal only')
    expect(token.tagName).toBe('SPAN')
  })

  it('sizes itself for where it sits: a token is small, a control is not', () => {
    const { rerender } = render(<Chip interactive={false} data-testid="pill">Internal</Chip>)
    expect(screen.getByTestId('pill')).toHaveAttribute('data-size', 'sm')

    rerender(<Chip data-testid="pill">Internal</Chip>)
    expect(screen.getByTestId('pill')).toHaveAttribute('data-size', 'md')
  })
})
