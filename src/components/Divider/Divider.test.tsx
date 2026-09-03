import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Divider } from './Divider'

/* A line, or a line with a word in it. The two are different things to anything
 * that is not looking: a bare rule is a separator and says so, while one with
 * "or" in the middle is a label and announcing it as a separator would put the
 * word somewhere a reader cannot reach. */

describe('Divider', () => {
  it('is a separator, and says which way it runs', () => {
    const { rerender } = render(<Divider />)
    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'horizontal')

    rerender(<Divider orientation="vertical" />)
    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'vertical')
  })

  it('carries a label in the line, and stops being a bare separator when it does', () => {
    render(<Divider>or</Divider>)
    expect(screen.getByText('or')).toBeInTheDocument()
    expect(screen.queryByRole('separator')).not.toBeInTheDocument()
  })
})
