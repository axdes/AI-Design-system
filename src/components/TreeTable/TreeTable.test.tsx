import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TreeTable, type TreeTableNode } from './TreeTable'

/* The treegrid contract is entirely keyboard and ARIA: none of it is visible
 * to a screenshot, and all of it is what makes the role honest. */

const NODES: TreeTableNode[] = [
  {
    id: 'eu',
    name: 'Europe',
    cells: ['812,400'],
    children: [
      { id: 'eu-de', name: 'Germany', cells: ['402,100'] },
      { id: 'eu-pl', name: 'Poland', cells: ['200,000'] },
    ],
  },
  { id: 'me', name: 'Middle East', cells: ['344,900'] },
]

const tree = (expanded: string[] = []) => (
  <TreeTable
    label="Revenue by region"
    defaultExpandedIds={expanded}
    columns={[{ header: 'Region' }, { header: 'Revenue', align: 'end' }]}
    nodes={NODES}
  />
)

describe('TreeTable', () => {
  it('is a treegrid, and a collapsed branch has no rows for its children', () => {
    render(tree())
    expect(screen.getByRole('treegrid', { name: 'Revenue by region' })).toBeInTheDocument()
    expect(screen.queryByText('Germany')).toBeNull()
  })

  it('says how deep a row is, and whether it opens', () => {
    render(tree(['eu']))
    const europe = screen.getByRole('row', { name: /Europe/ })
    expect(europe).toHaveAttribute('aria-level', '1')
    expect(europe).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('row', { name: /Germany/ })).toHaveAttribute('aria-level', '2')
    /* A leaf makes no claim about expanding: aria-expanded on a row with no
     * children promises children that are not there. */
    expect(screen.getByRole('row', { name: /Middle East/ })).not.toHaveAttribute('aria-expanded')
  })

  it('opens with Right, steps into the branch, and closes with Left', async () => {
    const user = userEvent.setup()
    render(tree())

    /* Two stops: the scroll region is a tab stop of its own (a region a mouse
       can scroll has to be reachable), then the widget's own row. */
    await user.tab()
    await user.tab()
    const europe = screen.getByRole('row', { name: /Europe/ })
    expect(europe).toHaveFocus()

    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('row', { name: /Europe/ })).toHaveAttribute('aria-expanded', 'true')

    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('row', { name: /Germany/ })).toHaveFocus()

    /* From a leaf, Left steps out to the parent rather than doing nothing. */
    await user.keyboard('{ArrowLeft}')
    expect(screen.getByRole('row', { name: /Europe/ })).toHaveFocus()

    await user.keyboard('{ArrowLeft}')
    expect(screen.getByRole('row', { name: /Europe/ })).toHaveAttribute('aria-expanded', 'false')
  })

  it('walks the visible rows with Down, Home and End', async () => {
    const user = userEvent.setup()
    render(tree(['eu']))

    await user.tab()
    await user.tab()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('row', { name: /Germany/ })).toHaveFocus()

    await user.keyboard('{End}')
    expect(screen.getByRole('row', { name: /Middle East/ })).toHaveFocus()

    await user.keyboard('{Home}')
    expect(screen.getByRole('row', { name: /Europe/ })).toHaveFocus()
  })
})
