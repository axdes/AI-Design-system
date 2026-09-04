import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Accordion } from './Accordion'

const ITEMS = [
  { id: 'a', title: 'First', content: 'First body' },
  { id: 'b', title: 'Second', content: 'Second body' },
  { id: 'c', title: 'Third', content: 'Third body', disabled: true },
]

describe('Accordion', () => {
  it('wires each header to its panel and starts from defaultOpen', () => {
    render(<Accordion items={ITEMS} defaultOpen={['a']} />)
    const first = screen.getByRole('button', { name: 'First' })
    expect(first).toHaveAttribute('aria-expanded', 'true')

    const panel = screen.getByRole('region', { name: 'First' })
    expect(panel).toHaveAttribute('aria-labelledby', first.id)
    expect(first).toHaveAttribute('aria-controls', panel.id)
    expect(screen.getByText('First body')).toBeInTheDocument()
    expect(screen.queryByText('Second body')).toBeNull()
  })

  it('opens one panel at a time by default', async () => {
    const user = userEvent.setup()
    render(<Accordion items={ITEMS} defaultOpen={['a']} />)

    await user.click(screen.getByRole('button', { name: 'Second' }))

    expect(screen.getByText('Second body')).toBeInTheDocument()
    expect(screen.queryByText('First body')).toBeNull() // the first closed
  })

  it('keeps several open when multiple', async () => {
    const user = userEvent.setup()
    render(<Accordion items={ITEMS} multiple defaultOpen={['a']} />)

    await user.click(screen.getByRole('button', { name: 'Second' }))

    expect(screen.getByText('First body')).toBeInTheDocument()
    expect(screen.getByText('Second body')).toBeInTheDocument()
  })

  it('moves between headers with arrow keys, skipping disabled ones', async () => {
    const user = userEvent.setup()
    render(<Accordion items={ITEMS} />)
    const first = screen.getByRole('button', { name: 'First' })
    first.focus()

    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('button', { name: 'Second' })).toHaveFocus()
    /* Third is disabled, so Down from Second wraps to First. */
    await user.keyboard('{ArrowDown}')
    expect(first).toHaveFocus()
  })

  it('does not open a disabled item', async () => {
    const user = userEvent.setup()
    render(<Accordion items={ITEMS} />)
    const third = screen.getByRole('button', { name: 'Third' })
    expect(third).toBeDisabled()

    await user.click(third)
    expect(screen.queryByText('Third body')).toBeNull()
  })

  /* THE BOUNDARY, not the middle. `End` is `headers.length - 1`, and one past
     the end focuses nothing at all — the reader presses End and the focus ring
     vanishes. A mutation run flipped this to `headers.length` and 471 tests
     stayed green (2026-08-29).

     "Last" means the last ENABLED header: the list is queried with
     `:not(:disabled)`, so Third is not in it and End belongs to Second. That is
     the contract worth holding — End should never land on something the reader
     cannot then open. */
  it('End goes to the last enabled header and Home to the first', async () => {
    const user = userEvent.setup()
    render(<Accordion items={ITEMS} />)

    await user.click(screen.getByRole('button', { name: 'First' }))
    await user.keyboard('{End}')
    expect(screen.getByRole('button', { name: 'Second' })).toHaveFocus()

    await user.keyboard('{Home}')
    expect(screen.getByRole('button', { name: 'First' })).toHaveFocus()
  })

  /* The pair a screen needs when the open state is the PAGE's: a step list whose
     progress the page owns, a panel a URL deep-links into. Two screens in one
     product hand-rolled a disclosure rather than take this component, and this
     is the reason they gave. */
  it('lets the screen own which panels are open', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    const { rerender } = render(
      <Accordion openIds={[]} onOpenChange={onOpenChange} items={ITEMS} />,
    )
    /* Controlled: the press reports, and nothing opens until the caller says so. */
    await user.click(screen.getByRole('button', { name: 'First' }))
    expect(onOpenChange).toHaveBeenCalledWith(['a'])
    expect(screen.getByRole('button', { name: 'First' })).toHaveAttribute('aria-expanded', 'false')

    rerender(<Accordion openIds={['a']} onOpenChange={onOpenChange} items={ITEMS} />)
    expect(screen.getByRole('button', { name: 'First' })).toHaveAttribute('aria-expanded', 'true')
  })
})
