import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Textarea } from './Textarea'

/* A multi-line field. It is the plain control, deliberately: <Field> puts the
 * label and the error around it. What it owes is that "invalid" reaches a
 * screen reader as a state rather than as a red border. */

describe('Textarea', () => {
  it('takes typing and hands it back', async () => {
    render(<Textarea aria-label="Notes" />)
    await userEvent.type(screen.getByLabelText('Notes'), 'two lines')
    expect(screen.getByLabelText('Notes')).toHaveValue('two lines')
  })

  it('says it is invalid to anyone who cannot see the border', () => {
    const { rerender } = render(<Textarea aria-label="Notes" invalid />)
    expect(screen.getByLabelText('Notes')).toHaveAttribute('aria-invalid', 'true')

    rerender(<Textarea aria-label="Notes" />)
    expect(screen.getByLabelText('Notes')).not.toHaveAttribute('aria-invalid')
  })

  /* Four rows, not one: a field that starts one line tall says "a few words"
   * when the question wants a paragraph. */
  it('starts tall enough to look like it wants a paragraph', () => {
    render(<Textarea aria-label="Notes" />)
    expect(screen.getByLabelText('Notes')).toHaveAttribute('rows', '4')
  })

  it('carries the input class, so it is the same control as the rest of the family', () => {
    render(<Textarea aria-label="Notes" />)
    expect(screen.getByLabelText('Notes')).toHaveClass('input')
  })
})
