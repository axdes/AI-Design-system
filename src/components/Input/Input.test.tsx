import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef } from 'react'
import { Input } from './Input'
import { Textarea } from '../Textarea'

/* Both fields carry the same two contracts, so they are held to them together:
 * `invalid` must reach assistive technology as aria-invalid rather than as a
 * red border only, and the caller must be able to hold a ref — React 19 passes
 * `ref` as an ordinary prop, but only if the prop type admits it, and for a
 * while this one did not. */

const cases = [
  { name: 'Input', render: (p: Record<string, unknown>) => <Input aria-label="Field" {...p} />, role: 'textbox' },
  { name: 'Textarea', render: (p: Record<string, unknown>) => <Textarea aria-label="Field" {...p} />, role: 'textbox' },
] as const

describe.each(cases)('$name', ({ render: renderField, role }) => {
  it('announces invalid, and says nothing when it is valid', () => {
    const { rerender } = render(renderField({}))
    expect(screen.getByRole(role)).not.toHaveAttribute('aria-invalid')

    rerender(renderField({ invalid: true }))
    expect(screen.getByRole(role)).toHaveAttribute('aria-invalid', 'true')
  })

  it('takes typed text through the caller onChange', async () => {
    const user = userEvent.setup()
    let seen = ''
    render(renderField({ value: '', onChange: (e: React.ChangeEvent<HTMLInputElement>) => { seen = e.target.value } }))

    await user.type(screen.getByRole(role), 'x')
    expect(seen).toBe('x')
  })

  it('honours disabled', async () => {
    const user = userEvent.setup()
    render(renderField({ disabled: true }))

    const field = screen.getByRole(role)
    await user.click(field)
    expect(field).toBeDisabled()
    expect(field).not.toHaveFocus()
  })
})

describe('Input', () => {
  it('hands the caller a ref to the real field', () => {
    function Host() {
      const ref = useRef<HTMLInputElement | null>(null)
      return (
        <>
          <Input ref={ref} aria-label="Field" />
          <button onClick={() => ref.current?.focus()}>focus it</button>
        </>
      )
    }
    render(<Host />)
    screen.getByRole('button', { name: 'focus it' }).click()

    expect(screen.getByRole('textbox', { name: 'Field' })).toHaveFocus()
  })

  it('does not swallow the caller type', () => {
    render(<Input type="email" aria-label="Email" />)
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAttribute('type', 'email')
  })
})

describe('Textarea', () => {
  it('defaults to four rows and lets the caller override', () => {
    const { rerender } = render(<Textarea aria-label="Notes" />)
    expect(screen.getByRole('textbox')).toHaveAttribute('rows', '4')

    rerender(<Textarea aria-label="Notes" rows={2} />)
    expect(screen.getByRole('textbox')).toHaveAttribute('rows', '2')
  })
})
