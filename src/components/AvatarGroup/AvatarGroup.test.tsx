import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AvatarGroup } from './AvatarGroup'

/* Faces in a row, overlapping. The count at the end is the part that can lie:
 * it is how many people are NOT shown, not how many there are. */

describe('AvatarGroup', () => {
  it('shows every face while they fit', () => {
    const { container } = render(<AvatarGroup items={[{ name: 'Ada Lovelace' }, { name: 'Alan Turing' }]} />)
    expect(container.querySelectorAll('.avatar-group-item')).toHaveLength(2)
    expect(container.querySelector('.avatar-group-overflow')).toBeNull()
  })

  it('counts the people it did not show, not the people there are', () => {
    const names = ['Ada', 'Alan', 'Grace', 'Edsger', 'Barbara', 'Donald']
    render(<AvatarGroup items={names.map((name) => ({ name }))} max={4} />)
    expect(screen.getByText('+2')).toBeInTheDocument()
    expect(screen.getByText('2 more')).toBeInTheDocument()
  })

  it('shows exactly its limit without an overflow marker at the boundary', () => {
    const { container } = render(<AvatarGroup items={[{ name: 'Ada' }, { name: 'Alan' }]} max={2} />)
    expect(container.querySelector('.avatar-group-overflow')).toBeNull()
  })
})
