import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Radio } from './Radio'
import { RadioGroup } from './RadioGroup'

describe('Radio', () => {
  it('picks exactly one of a set that shares a name', async () => {
    const user = userEvent.setup()
    render(
      <fieldset>
        <legend>Delivery</legend>
        <Radio name="delivery" value="standard" label="Standard" />
        <Radio name="delivery" value="express" label="Express" />
      </fieldset>,
    )
    await user.click(screen.getByLabelText('Express'))
    expect(screen.getByLabelText('Express')).toBeChecked()
    expect(screen.getByLabelText('Standard')).not.toBeChecked()
  })

  it('announces invalid on the GROUP, never on one option', () => {
    render(
      <RadioGroup
        name="reason"
        label="Why is the session moving?"
        value="none"
        onChange={() => undefined}
        options={[{ value: 'clash', label: 'Diary clash' }, { value: 'sick', label: 'Sick' }]}
        invalid
      />,
    )
    /* ARIA does not support aria-invalid on role="radio", and "nothing is
     * chosen" is a fact about the set rather than about any option in it. The
     * red circles are the visual half; this is the other half. */
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Diary clash')).not.toHaveAttribute('aria-invalid')
  })

  it('does not fire while disabled', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Radio name="plan" label="Team" disabled onChange={onChange} />)
    await user.click(screen.getByLabelText('Team'))
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Team')).toBeDisabled()
  })
})
