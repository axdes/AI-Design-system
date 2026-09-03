import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PasswordInput } from './PasswordInput'

/* Masked by default, and the toggle must not steal the caret: revealing is for
 * checking what you just typed, so being thrown out of the field defeats it. */

describe('PasswordInput', () => {
  it('is masked until asked', async () => {
    const user = userEvent.setup()
    render(<PasswordInput aria-label="Password" defaultValue="hunter2" />)

    const field = screen.getByLabelText('Password')
    expect(field).toHaveAttribute('type', 'password')

    await user.click(screen.getByRole('button', { name: 'Show password' }))
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text')
  })

  it('says which state the toggle is in', async () => {
    const user = userEvent.setup()
    render(<PasswordInput aria-label="Password" />)

    const toggle = screen.getByRole('button', { name: 'Show password' })
    expect(toggle).toHaveAttribute('aria-pressed', 'false')

    await user.click(toggle)
    const pressed = screen.getByRole('button', { name: 'Hide password' })
    expect(pressed).toHaveAttribute('aria-pressed', 'true')
  })

  it('leaves the caret in the field', async () => {
    const user = userEvent.setup()
    render(<PasswordInput aria-label="Password" />)

    const field = screen.getByLabelText('Password')
    await user.click(field)
    await user.click(screen.getByRole('button', { name: 'Show password' }))

    expect(field).toHaveFocus()
  })

  it('passes the value and the rest of the input contract through', async () => {
    const user = userEvent.setup()
    render(<PasswordInput aria-label="Password" invalid autoComplete="new-password" />)

    const field = screen.getByLabelText('Password')
    expect(field).toHaveAttribute('aria-invalid', 'true')
    expect(field).toHaveAttribute('autocomplete', 'new-password')

    await user.type(field, 'abc')
    expect(field).toHaveValue('abc')
  })

  it('takes the size the field beside it takes', () => {
    const { container } = render(<PasswordInput aria-label="Password" size="lg" />)
    expect(container.querySelector('input')).toHaveAttribute('data-size', 'lg')
  })
})
