import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Spinner } from './Spinner'

/* A busy marker. The spinning part is decoration; the whole of what it says is
 * the word beside it, which only exists for people who cannot see it turn. */

describe('Spinner', () => {
  it('is a live region so the wait is announced when it starts', () => {
    render(<Spinner label="Loading sessions" />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('says what is being waited for, in words', () => {
    render(<Spinner label="Loading sessions" />)
    expect(screen.getByText('Loading sessions')).toBeInTheDocument()
  })

  it('hides the turning glyph itself, which announces nothing', () => {
    const { container } = render(<Spinner label="Loading" />)
    expect(container.querySelector('svg')?.closest('[aria-hidden="true"]')).not.toBeNull()
  })
})
