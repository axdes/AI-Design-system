import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FormStack } from './FormStack'
import { Input } from '../Input'

/* The vertical rhythm of a form, and nothing else. It is two lines of code and
 * one decision: the spacing between fields is the system's, decided once, so
 * that a form built by hand and a form built from a template have the same
 * shape. What is worth pinning is that it does not wrap or reorder anything —
 * a field goes in and comes out in the same order, with its own label intact. */

describe('FormStack', () => {
  it('keeps its fields in order, untouched', () => {
    render(
      <FormStack>
        <Input aria-label="First" />
        <Input aria-label="Second" />
      </FormStack>,
    )
    const inputs = screen.getAllByRole('textbox')
    expect(inputs).toHaveLength(2)
    expect(inputs[0]).toHaveAccessibleName('First')
    expect(inputs[1]).toHaveAccessibleName('Second')
  })

  it('carries the class the spacing is written against', () => {
    const { container } = render(<FormStack><Input aria-label="First" /></FormStack>)
    expect(container.firstElementChild).toHaveClass('form-stack')
  })
})
