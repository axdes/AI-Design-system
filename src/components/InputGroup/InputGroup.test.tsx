import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { InputGroup } from './InputGroup'
import { Input } from '../Input'

/* A control with something attached to one end. The affixes are the component:
 * they only exist when given, they sit on the side they were named for, and an
 * empty string is a legitimate one — a currency field with no symbol yet still
 * needs the space kept. */

describe('InputGroup', () => {
  it('is the control alone when nothing is attached', () => {
    const { container } = render(<InputGroup><Input aria-label="Amount" /></InputGroup>)
    expect(container.querySelectorAll('.input-group-affix')).toHaveLength(0)
  })

  it('puts each affix on the side it was named for', () => {
    const { container } = render(
      <InputGroup prefix="$" suffix="per month"><Input aria-label="Amount" /></InputGroup>,
    )
    const affixes = [...container.querySelectorAll('.input-group-affix')]
    expect(affixes.map((a) => a.getAttribute('data-side'))).toEqual(['start', 'end'])
    expect(screen.getByText('$')).toBeInTheDocument()
    expect(screen.getByText('per month')).toBeInTheDocument()
  })

  /* An empty affix is not the same as no affix: the slot is still drawn, and a
   * field that reserves it does not jump the moment a symbol arrives. */
  it('keeps a slot given an empty affix, and drops it when there is none', () => {
    const { container, rerender } = render(<InputGroup prefix=""><Input aria-label="Amount" /></InputGroup>)
    expect(container.querySelectorAll('.input-group-affix')).toHaveLength(1)

    rerender(<InputGroup><Input aria-label="Amount" /></InputGroup>)
    expect(container.querySelectorAll('.input-group-affix')).toHaveLength(0)
  })

  it('carries the invalid and disabled states for the whole group', () => {
    const { container } = render(<InputGroup invalid disabled><Input aria-label="Amount" /></InputGroup>)
    const group = container.querySelector('.input-group')
    expect(group).toHaveAttribute('data-invalid')
    expect(group).toHaveAttribute('data-disabled')
  })
})
