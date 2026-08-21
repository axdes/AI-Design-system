import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Field } from './Field'
import { Input } from '../Input'

/* The point of this component is the WIRING. A red border tells a sighted user
 * something is wrong and tells everyone else nothing; a message rendered as a
 * loose <p> is not connected to the control it is about. */
describe('Field', () => {
  it('joins the error to the control with aria-describedby', () => {
    render(
      <Field label="Email" htmlFor="email" error="That address is already in use">
        <Input id="email" defaultValue="a@b.c" />
      </Field>,
    )
    const input = screen.getByLabelText('Email')
    const message = screen.getByText('That address is already in use')

    expect(input).toHaveAttribute('aria-describedby', message.id)
    expect(message.id).not.toBe('')
  })

  it('announces an error but not a hint', () => {
    /* An error appears in response to something the user just did. A hint is
     * there from the start and interrupting with it is noise. */
    const { unmount } = render(
      <Field label="Email" error="Required">
        <Input />
      </Field>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Required')
    unmount()

    render(
      <Field label="Email" hint="We never share it">
        <Input />
      </Field>,
    )
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getByText('We never share it')).toBeInTheDocument()
  })

  it('an error replaces the hint rather than stacking with it', () => {
    render(
      <Field label="Email" hint="We never share it" error="Required">
        <Input />
      </Field>,
    )
    expect(screen.getByText('Required')).toBeInTheDocument()
    expect(screen.queryByText('We never share it')).toBeNull()
  })

  it('keeps a description the control already had', () => {
    render(
      <Field label="Email" error="Required">
        <Input aria-describedby="external-note" />
      </Field>,
    )
    const described = screen.getByRole('textbox').getAttribute('aria-describedby')!
    expect(described.split(' ')).toContain('external-note')
    expect(described.split(' ')).toHaveLength(2)
  })

  it('leaves a composed field alone rather than guessing which child to wire', () => {
    /* Two children means the caller built something custom; silently attaching
     * the description to whichever came first would be a guess. */
    render(
      <Field label="Range" error="Start must precede end">
        <Input aria-label="Start" />
        <Input aria-label="End" />
      </Field>,
    )
    expect(screen.getByLabelText('Start')).not.toHaveAttribute('aria-describedby')
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('adds nothing when there is no message', () => {
    render(
      <Field label="Email">
        <Input />
      </Field>,
    )
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-describedby')
  })

  it('marks a required field for sight without repeating it to a screen reader', () => {
    /* The asterisk is decoration; `required` on the control is the real signal,
     * and reading "Email star" aloud is not it. */
    render(
      <Field label="Email" required>
        <Input required />
      </Field>,
    )
    expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByRole('textbox')).toBeRequired()
  })
})
