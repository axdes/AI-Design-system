import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FilterDropdown } from './FilterDropdown'

type Status = 'draft' | 'review' | 'published'

const OPTIONS = [
  { value: 'draft' as const, label: 'Draft' },
  { value: 'review' as const, label: 'In review' },
  { value: 'published' as const, label: 'Published' },
]

function Host({ multi = true }: { multi?: boolean }) {
  const [value, setValue] = useState<Status[]>([])
  return (
    <>
      <FilterDropdown<Status>
        label="Status"
        allLabel="All statuses"
        multi={multi}
        options={OPTIONS}
        value={value}
        onChange={setValue}
      />
      <output>{value.join(',') || 'all'}</output>
    </>
  )
}

const selection = () => screen.getByRole('status').textContent

describe('FilterDropdown', () => {
  it('starts on "all" and stays open while multi-selecting', async () => {
    const user = userEvent.setup()
    render(<Host />)
    await user.click(screen.getByRole('button', { name: /Status/ }))

    expect(screen.getByRole('menuitem', { name: 'All statuses' })).toHaveAttribute('aria-current', 'true')

    await user.click(screen.getByRole('menuitem', { name: 'Draft' }))
    expect(selection()).toBe('draft')
    /* multi keeps the menu open so several values can be picked in one go. */
    await user.click(screen.getByRole('menuitem', { name: 'In review' }))
    expect(selection()).toBe('draft,review')
  })

  it('collapses a full hand-picked set back to "all"', async () => {
    const user = userEvent.setup()
    render(<Host />)
    await user.click(screen.getByRole('button', { name: /Status/ }))

    for (const label of ['Draft', 'In review', 'Published']) {
      await user.click(screen.getByRole('menuitem', { name: label }))
    }

    /* Everything selected means no filter at all, so the value normalises to
     * empty and the All row takes the check back. */
    expect(selection()).toBe('all')
    expect(screen.getByRole('menuitem', { name: 'All statuses' })).toHaveAttribute('aria-current', 'true')
  })

  it('replaces the value in single-select mode', async () => {
    const user = userEvent.setup()
    render(<Host multi={false} />)
    await user.click(screen.getByRole('button', { name: /Status/ }))
    await user.click(screen.getByRole('menuitem', { name: 'Draft' }))
    expect(selection()).toBe('draft')

    await user.click(screen.getByRole('button', { name: /Status/ }))
    await user.click(screen.getByRole('menuitem', { name: 'Published' }))

    expect(selection()).toBe('published')
  })
})
