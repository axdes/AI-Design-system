import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DiffTable } from './DiffTable'

/* What changed, field by field. Colour carries the kind of change and colour
 * alone would fail SC 1.4.1, so the empty side says a WORD — an added field has
 * no before, and "None" is the answer rather than an empty cell. */

const changes = [
  { field: 'Owner', kind: 'changed' as const, before: 'Ada', after: 'Grace' },
  { field: 'Tier', kind: 'added' as const, after: 'Team' },
  { field: 'Trial', kind: 'removed' as const, before: '14 days' },
]

describe('DiffTable', () => {
  it('shows both sides of a change', () => {
    render(<DiffTable label="Changes" changes={changes} />)
    expect(screen.getByText('Ada')).toBeInTheDocument()
    expect(screen.getByText('Grace')).toBeInTheDocument()
  })

  it('says "None" where a side does not exist, rather than leaving a hole', () => {
    render(<DiffTable label="Changes" changes={changes} />)
    expect(screen.getAllByText('None')).toHaveLength(2)
  })

  it('takes its own words for the two sides', () => {
    render(<DiffTable label="Changes" changes={changes} beforeHeader="Was" afterHeader="Now" noneLabel="—" />)
    expect(screen.getByRole('columnheader', { name: 'Was' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Now' })).toBeInTheDocument()
  })

  it('is a real table named by its caption', () => {
    render(<DiffTable label="Changes" changes={changes} />)
    expect(screen.getByRole('table', { name: 'Changes' })).toBeInTheDocument()
  })
})
