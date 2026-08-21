import { describe, expect, it } from 'vitest'
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
})
