import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { RangeSlider } from './RangeSlider'

describe('RangeSlider', () => {
  it('is two labelled ranges, one per bound', () => {
    render(<RangeSlider label="Budget" value={[20, 60]} onChange={() => undefined} min={0} max={100} />)
    expect(screen.getByRole('slider', { name: 'Budget start' })).toHaveValue('20')
    expect(screen.getByRole('slider', { name: 'Budget end' })).toHaveValue('60')
  })

  it('reports the whole tuple when one bound moves', () => {
    const onChange = vi.fn()
    render(<RangeSlider label="Budget" value={[20, 60]} onChange={onChange} />)

    fireEvent.change(screen.getByRole('slider', { name: 'Budget start' }), { target: { value: '35' } })

    expect(onChange).toHaveBeenCalledWith([35, 60])
  })

  it('clamps each thumb against the other instead of crossing', () => {
    const onChange = vi.fn()
    render(<RangeSlider label="Budget" value={[20, 60]} onChange={onChange} />)

    /* Dragging the start past the end pins it AT the end; same the other way. */
    fireEvent.change(screen.getByRole('slider', { name: 'Budget start' }), { target: { value: '80' } })
    expect(onChange).toHaveBeenLastCalledWith([60, 60])

    fireEvent.change(screen.getByRole('slider', { name: 'Budget end' }), { target: { value: '5' } })
    expect(onChange).toHaveBeenLastCalledWith([20, 20])
  })

  it('formats the shown span when showValue is set', () => {
    render(
      <RangeSlider label="Budget" value={[25, 70]} onChange={() => undefined} showValue formatValue={(v) => `SAR ${v}k`} />,
    )
    expect(screen.getByText('SAR 25k to SAR 70k')).toBeInTheDocument()
  })

  it('disables both thumbs, not only the look of them', () => {
    const { container } = render(
      <RangeSlider label="Price" value={[10, 40]} onChange={() => undefined} disabled />,
    )
    expect(container.querySelector('.rangeslider')).toHaveAttribute('data-disabled')
    for (const input of container.querySelectorAll('input')) expect(input).toBeDisabled()
  })
})
