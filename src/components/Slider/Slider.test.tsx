import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Slider } from './Slider'

describe('Slider', () => {
  it('is a labelled range with the current value', () => {
    render(<Slider label="Volume" value={30} onChange={() => undefined} min={0} max={100} />)
    const input = screen.getByRole('slider', { name: 'Volume' })
    expect(input).toHaveValue('30')
    /* Native range: min/max are DOM attributes the browser maps into the a11y
     * tree; there is no explicit aria-valuemin to set. */
    expect(input).toHaveAttribute('min', '0')
    expect(input).toHaveAttribute('max', '100')
  })

  it('reports the numeric value through onChange', () => {
    const onChange = vi.fn()
    render(<Slider label="Volume" value={30} onChange={onChange} />)

    /* The slider forwards Number(value), not the event object. */
    fireEvent.change(screen.getByRole('slider'), { target: { value: '55' } })

    expect(onChange).toHaveBeenCalledWith(55)
  })

  it('formats the shown value when showValue is set', () => {
    render(<Slider label="Budget" value={40} onChange={() => undefined} showValue formatValue={(v) => `SAR ${v}k`} />)
    expect(screen.getByText('SAR 40k')).toBeInTheDocument()
  })

  it('stays controlled: the value only moves when the parent updates it', () => {
    function Host() {
      const [v, setV] = useState(20)
      return <Slider label="Level" value={v} onChange={setV} min={0} max={100} step={10} />
    }
    render(<Host />)
    const input = screen.getByRole('slider')

    fireEvent.change(input, { target: { value: '30' } })
    expect(input).toHaveValue('30')
  })
})
