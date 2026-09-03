import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NumberInput } from './NumberInput'

describe('NumberInput', () => {
  it('is a labelled spinbutton with the value', () => {
    render(<NumberInput label="Quantity" value={3} onChange={() => undefined} />)
    expect(screen.getByRole('spinbutton', { name: 'Quantity' })).toHaveValue(3)
  })

  it('steps up and down through the buttons', async () => {
    const user = userEvent.setup()
    function Host() {
      const [v, setV] = useState(2)
      return <NumberInput label="Qty" value={v} onChange={setV} step={2} />
    }
    render(<Host />)
    await user.click(screen.getByRole('button', { name: 'Increase' }))
    expect(screen.getByRole('spinbutton')).toHaveValue(4)
    await user.click(screen.getByRole('button', { name: 'Decrease' }))
    expect(screen.getByRole('spinbutton')).toHaveValue(2)
  })

  it('clamps to min/max and disables the edge button', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<NumberInput label="Qty" value={1} onChange={onChange} min={1} max={3} />)

    expect(screen.getByRole('button', { name: 'Decrease' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Increase' }))
    expect(onChange).toHaveBeenCalledWith(2)
  })

  /* THE STEPPERS SCALE WITH THE FIELD. A large field takes md buttons and
     everything smaller takes sm; a mutation run swapped the two arms so a large
     field got the small pair and a small field the large one, and nothing failed
     (2026-08-29). An unsized pair beside a 48px field is the mismatch this
     ternary exists to prevent. */
  it('gives a large field the larger steppers and a default field the small ones', () => {
    const { container, unmount } = render(<NumberInput label="Qty" size="lg" value={1} onChange={() => undefined} />)
    for (const b of container.querySelectorAll<HTMLElement>('.icon-button')) expect(b).toHaveAttribute('data-size', 'md')
    unmount()

    const { container: small } = render(<NumberInput label="Qty" value={1} onChange={() => undefined} />)
    for (const b of small.querySelectorAll<HTMLElement>('.icon-button')) expect(b).toHaveAttribute('data-size', 'sm')
  })

  /* Three props with nowhere to show themselves on screen: the steppers are
     icon-only, so their words exist only as an accessible name, and invalid is
     a data attribute the CSS paints. A locale that is not English is where all
     three are first read. */
  it('marks itself invalid and names both steppers in the caller’s words', () => {
    const { container } = render(
      <NumberInput
        label="Antal"
        value={2}
        onChange={() => undefined}
        invalid
        decrementLabel="Minska"
        incrementLabel="Öka"
      />,
    )
    expect(container.querySelector('.number-input')).toHaveAttribute('data-invalid')
    expect(screen.getByRole('button', { name: 'Minska' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Öka' })).toBeInTheDocument()
  })
})
