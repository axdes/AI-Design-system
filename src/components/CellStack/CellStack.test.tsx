import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CellStack } from './CellStack'

/* Two lines in one table cell: the value, and the thing that identifies it.
 * The second line is optional and an EMPTY one is still a line — a column of
 * these where one row has no second line must not close up, or the rows stop
 * lining up with each other. */

describe('CellStack', () => {
  it('is one line when there is nothing under it', () => {
    const { container } = render(<CellStack>Ada Lovelace</CellStack>)
    expect(container.querySelector('.cell-stack-secondary')).toBeNull()
  })

  it('carries the second line under the value', () => {
    render(<CellStack secondary="ada@example.com">Ada Lovelace</CellStack>)
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument()
    expect(screen.getByText('ada@example.com')).toBeInTheDocument()
  })

  /* An empty string is a caller saying "there is a second line and it happens
   * to be blank here", which is not the same as not having one. */
  it('keeps an empty second line, because a column has to line up', () => {
    const { container } = render(<CellStack secondary="">Ada Lovelace</CellStack>)
    expect(container.querySelector('.cell-stack-secondary')).toBeInTheDocument()
  })
})
