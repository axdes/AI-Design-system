import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorSummary, type FormError } from './ErrorSummary'

/* The summary exists for the two people a red border never reaches: the
 * keyboard user in a scrolled form and the screen-reader user who has already
 * moved past the fields. Both depend on behaviour a render test can check and a
 * golden example cannot: does it take focus when the submit fails, does it take
 * it AGAIN on the next failure, and does a row actually put the caret in its
 * field. */

const ERRORS: FormError[] = [
  { id: 'email', message: 'Enter an email address with an @ in it' },
  { id: 'area', message: 'Choose an area' },
]

function Form({ errors }: { errors: FormError[] }) {
  return (
    <>
      <ErrorSummary errors={errors} />
      <input id="email" aria-label="Email" />
      <input id="area" aria-label="Area" />
    </>
  )
}

describe('ErrorSummary', () => {
  it('says nothing while the form is valid', () => {
    render(<Form errors={[]} />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('counts the failures in its heading', () => {
    render(<Form errors={ERRORS} />)
    expect(screen.getByRole('heading', { name: 'There are 2 problems' })).toBeInTheDocument()
  })

  it('takes focus when it appears, so the failure is not silent', () => {
    const { rerender } = render(<Form errors={[]} />)
    rerender(<Form errors={ERRORS} />)
    expect(screen.getByRole('alert')).toHaveFocus()
  })

  it('takes focus again when the NEXT submit fails differently', async () => {
    const { rerender } = render(<Form errors={ERRORS} />)
    /* The user goes off to fix something: focus is no longer on the summary. */
    screen.getByLabelText('Email').focus()
    rerender(<Form errors={[{ id: 'area', message: 'Choose an area' }]} />)
    expect(screen.getByRole('alert')).toHaveFocus()
  })

  it('puts the caret in the field a row names', async () => {
    const user = userEvent.setup()
    render(<Form errors={ERRORS} />)

    await user.click(screen.getByRole('link', { name: 'Choose an area' }))
    expect(screen.getByLabelText('Area')).toHaveFocus()
  })
})
