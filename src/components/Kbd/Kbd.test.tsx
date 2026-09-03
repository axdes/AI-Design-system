import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { Kbd } from './Kbd'

/* A key on a keyboard. It is one element and one decision: the element is
 * <kbd>, because "press Escape" written in a styled span is a sentence about a
 * key and not a key. */

describe('Kbd', () => {
  it('is a real kbd element', () => {
    const { container } = render(<Kbd>Esc</Kbd>)
    expect(container.querySelector('kbd')).toHaveTextContent('Esc')
  })
})
