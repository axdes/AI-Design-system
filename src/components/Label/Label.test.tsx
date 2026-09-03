import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Label } from './Label'

/* The words in front of a control. It is a real <label>, and the association is
 * the caller's to make — which is the whole reason it takes everything else
 * through: a label that swallowed htmlFor would be a label pointing at nothing. */

describe('Label', () => {
  it('is a real label, associated with the control the caller names', () => {
    render(
      <>
        <Label htmlFor="email">Work email</Label>
        <input id="email" />
      </>,
    )
    expect(screen.getByLabelText('Work email')).toBeInTheDocument()
    expect(screen.getByText('Work email').tagName).toBe('LABEL')
  })
})
