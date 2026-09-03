import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PivotTable } from './PivotTable'

/* A matrix read for its margins as much as for its cells. The distinction that
 * matters is the one nobody sees until it is wrong: a crossing with NO
 * observation is not a zero, and printing it as one invents data. */

const rows = [{ key: 'eu', label: 'Europe' }, { key: 'us', label: 'Americas' }]
const columns = [{ key: 'q1', label: 'Q1' }, { key: 'q2', label: 'Q2' }]
const value = (r: string, c: string) => (r === 'eu' && c === 'q1' ? 10 : r === 'us' && c === 'q2' ? 4 : undefined)

describe('PivotTable', () => {
  it('is a real table with a header per column and a header per row', () => {
    render(<PivotTable label="Revenue" rows={rows} columns={columns} value={value} rowHeader="Region" />)
    expect(screen.getByRole('table', { name: 'Revenue' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Q1' })).toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: 'Europe' })).toBeInTheDocument()
  })

  it('leaves a crossing with no observation empty, because that is not a zero', () => {
    render(<PivotTable label="Revenue" rows={rows} columns={columns} value={value} rowHeader="Region" />)
    expect(screen.queryByText('0')).not.toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
  })

  it('writes its numbers the way the caller writes numbers', () => {
    render(
      <PivotTable label="Revenue" rows={rows} columns={columns} value={value} rowHeader="Region"
        format={(n) => `${n} k`} />,
    )
    expect(screen.getByText('10 k')).toBeInTheDocument()
  })

  /* The margins are the reason a pivot is a pivot rather than a grid, and a
   * total that counted a missing observation as zero would be a different
   * number from the one a reader adds up by eye. */
  it('adds the margins when asked, over the observations there are', () => {
    render(<PivotTable label="Revenue" rows={rows} columns={columns} value={value} rowHeader="Region" totals />)
    expect(screen.getAllByText('14').length).toBeGreaterThan(0)
  })
})
