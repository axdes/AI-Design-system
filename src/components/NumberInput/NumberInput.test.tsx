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
})
