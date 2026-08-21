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
})
