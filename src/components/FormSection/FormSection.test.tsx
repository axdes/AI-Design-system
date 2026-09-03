import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FormSection } from './FormSection'
import { Input } from '../Input'

/* A named group of fields. It is a real fieldset with a real legend, which is
 * what makes a screen reader say the group's name in front of each field inside
 * it — a heading over a div says the name once, to whoever was listening. */

describe('FormSection', () => {
  it('is a fieldset named by its legend', () => {
    render(<FormSection title="Contact"><Input aria-label="Email" /></FormSection>)
    expect(screen.getByRole('group', { name: /Contact/ })).toBeInTheDocument()
  })

  it('carries a description when there is one, and nothing when there is not', () => {
    const { container, rerender } = render(
      <FormSection title="Contact" description="How we reach you."><Input aria-label="Email" /></FormSection>,
    )
    expect(screen.getByText('How we reach you.')).toBeInTheDocument()

    rerender(<FormSection title="Contact"><Input aria-label="Email" /></FormSection>)
    expect(container.querySelector('.form-section-desc')).toBeNull()
  })

  it('holds its fields in the form stack, so the rhythm comes from the system', () => {
    const { container } = render(<FormSection title="Contact"><Input aria-label="Email" /></FormSection>)
    expect(container.querySelector('.form-stack')).toBeInTheDocument()
  })
})
