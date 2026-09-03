import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ComparisonTable } from './ComparisonTable'

/* Plans down the side, features across the top. Everything that can go wrong
 * here is invisible: a tick is a shape, and a shape says nothing — so both
 * answers carry a word, including the empty one, because a blank cell reads as
 * "nobody filled this in" rather than as "no". */

const subjects = [{ key: 'free', name: 'Free' }, { key: 'team', name: 'Team' }]
const rows = [
  { label: 'SSO', values: { free: false, team: true } },
  { label: 'Seats', values: { free: '1', team: 'Unlimited' } },
]

describe('ComparisonTable', () => {
  it('says yes and no in words, not only in glyphs', () => {
    render(<ComparisonTable label="Plans" subjects={subjects} rows={rows} />)
    expect(screen.getByText('Included')).toBeInTheDocument()
    expect(screen.getByText('Not included')).toBeInTheDocument()
  })

  it('carries values that are not booleans as they are', () => {
    render(<ComparisonTable label="Plans" subjects={subjects} rows={rows} />)
    expect(screen.getByText('Unlimited')).toBeInTheDocument()
  })

  it('is a real table with a caption and a header per subject', () => {
    render(<ComparisonTable label="Plans" subjects={subjects} rows={rows} />)
    expect(screen.getByRole('table', { name: 'Plans' })).toBeInTheDocument()
    expect(screen.getByText('Free')).toBeInTheDocument()
    expect(screen.getByText('Team')).toBeInTheDocument()
  })
})
