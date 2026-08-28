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

function Host({ multiple = true }: { multiple?: boolean }) {
  const [value, setValue] = useState<Status[]>([])
  return (
    <>
      <FilterDropdown<Status>
        label="Status"
        allLabel="All statuses"
        multiple={multiple}
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
  it('starts on "all" and stays open while multiple-selecting', async () => {
    const user = userEvent.setup()
    render(<Host />)
    await user.click(screen.getByRole('button', { name: /Status/ }))

    expect(screen.getByRole('menuitem', { name: 'All statuses' })).toHaveAttribute('aria-current', 'true')

    await user.click(screen.getByRole('menuitem', { name: 'Draft' }))
    expect(selection()).toBe('draft')
    /* multiple keeps the menu open so several values can be picked in one go. */
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
    render(<Host multiple={false} />)
    await user.click(screen.getByRole('button', { name: /Status/ }))
    await user.click(screen.getByRole('menuitem', { name: 'Draft' }))
    expect(selection()).toBe('draft')

    await user.click(screen.getByRole('button', { name: /Status/ }))
    await user.click(screen.getByRole('menuitem', { name: 'Published' }))

    expect(selection()).toBe('published')
  })

  /* A mutation test deleted this accessible name and the whole suite — 471
     tests, axe over every golden example — stayed green (2026-08-26). The name
     IS the contract here, and nothing was holding it. */
  it('names its search field after what it filters, not just "search"', async () => {
    const user = userEvent.setup()
    function Harness() {
      const [value, setValue] = useState<string[]>([])
      return (
        <FilterDropdown
          label="Status"
          allLabel="All statuses"
          searchable
          searchPlaceholder="Filter by status"
          options={[{ value: 'draft', label: 'Draft' }, { value: 'live', label: 'Live' }]}
          value={value}
          onChange={setValue}
          multiple
        />
      )
    }
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: /Status/ }))
    /* A screen with two of these has two search fields, and "Search" twice
       tells a screen-reader user nothing about which one they are in. */
    expect(await screen.findByRole('searchbox', { name: 'Filter by status' })).toBeInTheDocument()
  })
})
