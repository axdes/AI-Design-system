import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SegmentedControl } from './SegmentedControl'

type View = 'list' | 'board' | 'calendar'
const OPTS = [
  { value: 'list' as const, label: 'List' },
  { value: 'board' as const, label: 'Board' },
  { value: 'calendar' as const, label: 'Calendar' },
]

function Host() {
  const [v, setV] = useState<View>('list')
  return (
    <>
      <SegmentedControl<View> label="View" value={v} onChange={setV} options={OPTS} />
      <output>{v}</output>
    </>
  )
}

describe('SegmentedControl', () => {
  it('is a radiogroup with one checked radio and roving tabindex', () => {
    render(<Host />)
    expect(screen.getByRole('radiogroup', { name: 'View' })).toBeInTheDocument()
    const radios = screen.getAllByRole('radio')
    expect(radios[0]).toHaveAttribute('aria-checked', 'true')
    expect(radios[0]).toHaveAttribute('tabindex', '0')
    expect(radios[1]).toHaveAttribute('tabindex', '-1')
  })

  it('selects by click', async () => {
    const user = userEvent.setup()
    render(<Host />)
    await user.click(screen.getByRole('radio', { name: 'Board' }))
    expect(screen.getByRole('status')).toHaveTextContent('board')
  })

  it('moves and selects with arrow keys, wrapping', async () => {
    const user = userEvent.setup()
    render(<Host />)
    screen.getByRole('radio', { name: 'List' }).focus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('status')).toHaveTextContent('board')
    await user.keyboard('{ArrowLeft}{ArrowLeft}')
    expect(screen.getByRole('status')).toHaveTextContent('calendar') // wrapped past the start
  })

  /* THE BOUNDARY. `End` is `options.length - 1`; one past it is `undefined`,
     and `options[next].value` then throws on a key the reader is entitled to
     press. A mutation run flipped it and nothing failed (2026-08-29). */
  it('End selects the LAST option and Home the first', async () => {
    const user = userEvent.setup()
    render(<Host />)
    const radios = screen.getAllByRole('radio')

    radios[0].focus()
    await user.keyboard('{End}')
    expect(screen.getByRole('radio', { name: 'Calendar' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'Calendar' })).toHaveFocus()

    await user.keyboard('{Home}')
    expect(screen.getByRole('radio', { name: 'List' })).toHaveAttribute('aria-checked', 'true')
  })

  it('inverts its fills for a control sitting on a grey surface', () => {
    const { container } = render(
      <SegmentedControl
        label="View"
        value="list"
        onChange={() => undefined}
        options={[{ value: 'list', label: 'List' }, { value: 'grid', label: 'Grid' }]}
        surface="muted"
      />,
    )
    expect(container.querySelector('.segmented')).toHaveAttribute('data-surface', 'muted')
  })
})
