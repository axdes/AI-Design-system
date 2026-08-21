import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Checkbox } from './Checkbox'

/* The box the user sees is a styled span; the box the browser and the screen
 * reader see is a real <input>. That split is the whole design, and it is also
 * the whole risk: `indeterminate` is a DOM property with no HTML attribute, so
 * it can only be set imperatively and is exactly the kind of prop that quietly
 * stops working. */

const box = () => screen.getByRole('checkbox')

describe('Checkbox', () => {
  it('is a real checkbox, named by its label', () => {
    render(<Checkbox label="Include archived" />)
    expect(screen.getByRole('checkbox', { name: 'Include archived' })).toBeInTheDocument()
  })

  it('toggles by clicking the label text, not just the box', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Checkbox label="Include archived" onChange={onChange} />)

    await user.click(screen.getByText('Include archived'))
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('toggles with Space', async () => {
    const user = userEvent.setup()
    render(<Checkbox label="Include archived" />)

    box().focus()
    await user.keyboard(' ')
    expect(box()).toBeChecked()
  })

  it('reaches the DOM property that mixed state actually lives in', () => {
    const { rerender } = render(<Checkbox label="Select all" indeterminate />)
    expect((box() as HTMLInputElement).indeterminate).toBe(true)

    rerender(<Checkbox label="Select all" indeterminate={false} />)
    expect((box() as HTMLInputElement).indeterminate).toBe(false)
  })

  it('is not mixed unless asked', () => {
    render(<Checkbox label="Include archived" />)
    expect((box() as HTMLInputElement).indeterminate).toBe(false)
  })

  it('honours disabled', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Checkbox label="Include archived" disabled onChange={onChange} />)

    await user.click(screen.getByText('Include archived'))

    expect(box()).toBeDisabled()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('stays form-native, so a form submits its value', () => {
    render(
      <form data-testid="f">
        <Checkbox label="Include archived" name="archived" value="yes" defaultChecked />
      </form>,
    )
    const data = new FormData(screen.getByTestId('f') as HTMLFormElement)
    expect(data.get('archived')).toBe('yes')
  })
})
