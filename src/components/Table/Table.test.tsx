import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Table, TableScroll, THead, TBody, Tr, Th, Td } from './Table'

/* A sortable header is a control, and the direction it is sorted in has to be
 * announced rather than drawn. Everything here is invisible to a screenshot:
 * whether the header is operable, and whether aria-sort says what the arrow says. */

const Grid = ({ direction = null as 'asc' | 'desc' | null, onSort = () => undefined, selected = false }) => (
  <Table>
    <THead>
      <Tr>
        <Th sortable sortDirection={direction} onSort={onSort}>Name</Th>
        <Th>Owner</Th>
      </Tr>
    </THead>
    <TBody>
      <Tr selected={selected}>
        <Td>Q3 report</Td>
        <Td>Ada</Td>
      </Tr>
    </TBody>
  </Table>
)

describe('Table', () => {
  it('makes a sortable header operable, and leaves a plain one alone', () => {
    render(<Grid />)

    expect(screen.getByRole('button', { name: /Name/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Owner/ })).toBeNull()
  })

  it('announces the sort direction, and "none" while inactive', () => {
    const { rerender } = render(<Grid />)
    expect(screen.getByRole('columnheader', { name: /Name/ })).toHaveAttribute('aria-sort', 'none')

    rerender(<Grid direction="asc" />)
    expect(screen.getByRole('columnheader', { name: /Name/ })).toHaveAttribute('aria-sort', 'ascending')

    rerender(<Grid direction="desc" />)
    expect(screen.getByRole('columnheader', { name: /Name/ })).toHaveAttribute('aria-sort', 'descending')
  })

  it('leaves a non-sortable header without an aria-sort claim', () => {
    render(<Grid />)
    expect(screen.getByRole('columnheader', { name: 'Owner' })).not.toHaveAttribute('aria-sort')
  })

  it('asks the caller to sort, on click and from the keyboard', async () => {
    const onSort = vi.fn()
    const user = userEvent.setup()
    render(<Grid onSort={onSort} />)

    const header = screen.getByRole('button', { name: /Name/ })
    await user.click(header)
    header.focus()
    await user.keyboard('{Enter}')

    expect(onSort).toHaveBeenCalledTimes(2)
  })

  it('marks a selected row as selected, and says nothing when it is not', () => {
    const { rerender } = render(<Grid />)
    expect(screen.getAllByRole('row')[1]).not.toHaveAttribute('aria-selected')

    rerender(<Grid selected />)
    expect(screen.getAllByRole('row')[1]).toHaveAttribute('aria-selected', 'true')
  })

  it('is a real table, so rows and cells are navigable', () => {
    render(<Grid />)

    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getAllByRole('columnheader')).toHaveLength(2)
    expect(screen.getAllByRole('cell')).toHaveLength(2)
  })

  /* A region a mouse can scroll has to be reachable by keyboard, and a bare tab
   * stop that announces nothing is worse than none. */
  it('makes the scroll container a named, focusable region', async () => {
    const user = userEvent.setup()
    render(<TableScroll label="Reports"><Grid /></TableScroll>)

    const region = screen.getByRole('region', { name: 'Reports' })
    expect(region).toHaveAttribute('tabindex', '0')

    await user.tab()
    expect(region).toHaveFocus()
  })
})
