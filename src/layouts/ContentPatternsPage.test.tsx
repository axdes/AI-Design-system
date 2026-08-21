import { describe, expect, it } from 'vitest'
import { fireEvent, screen, within } from '@testing-library/react'
import { renderScreen } from '@/test/renderScreen'
import { ContentPatternsPage } from './ContentPatternsPage'
import { MOCK_CONTENT } from '@/data/mockContent'

const titles = MOCK_CONTENT.slice(0, 5).map((c) => c.title)

describe('content-patterns behaviours', () => {
  it('content-patterns#rows-are-the-default — the first render is the representation the rules choose', () => {
    renderScreen(<ContentPatternsPage />)
    /* Rows, not a table and not the card grid: no table on screen yet. */
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.getByText(titles[0])).toBeInTheDocument()
  })

  it('content-patterns#switch-changes-representation-not-data — the same items, the same order, in every view', () => {
    renderScreen(<ContentPatternsPage />)
    fireEvent.click(screen.getByRole('radio', { name: /table/i }))
    const table = screen.getByRole('table')
    const cells = within(table).getAllByRole('cell').map((td) => td.textContent)
    for (const title of titles) expect(cells.join('|')).toContain(title)
    /* Order survives: the first data row carries the first item. */
    expect(within(table).getAllByRole('row')[1].textContent).toContain(titles[0])
    fireEvent.click(screen.getByRole('radio', { name: /cards/i }))
    for (const title of titles) expect(screen.getByText(title)).toBeInTheDocument()
  })
})
