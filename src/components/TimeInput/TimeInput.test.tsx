import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { TimeInput } from './TimeInput'

describe('TimeInput', () => {
  it('is a labelled native time field carrying the value', () => {
    render(<TimeInput aria-label="Starts at" value="09:30" onChange={() => undefined} />)
    expect(screen.getByLabelText('Starts at')).toHaveValue('09:30')
  })

  it('reports the 24-hour string through onChange', () => {
    const onChange = vi.fn()
    render(<TimeInput aria-label="Starts at" value="09:30" onChange={onChange} />)

    /* The component forwards e.target.value, not the event object. */
    fireEvent.change(screen.getByLabelText('Starts at'), { target: { value: '14:45' } })

    expect(onChange).toHaveBeenCalledWith('14:45')
  })

  it('marks the field invalid for assistive tech', () => {
    render(<TimeInput aria-label="Starts at" invalid />)
    expect(screen.getByLabelText('Starts at')).toHaveAttribute('aria-invalid', 'true')
  })
})
