import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { Table, TableScroll, THead, TBody, TFoot, Tr, Th, Td, TdExpand, TrGroup, TrDetail, TableEmpty, TableSkeleton } from './Table'

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

  /* The name a table carries itself. An aria-label on the scroll region names
   * the REGION; a heading above names the section; only the caption names the
   * table, and only the caption travels with it into a copy or an export. */
  it('names itself with a caption, and keeps the name when it is hidden', () => {
    const { rerender } = render(<Table caption="Invoices due"><TBody><Tr><Td>1</Td></Tr></TBody></Table>)
    expect(screen.getByRole('table', { name: 'Invoices due' })).toBeInTheDocument()

    rerender(<Table caption="Invoices due" captionHidden><TBody><Tr><Td>1</Td></Tr></TBody></Table>)
    expect(screen.getByRole('table', { name: 'Invoices due' })).toBeInTheDocument()
  })

  /* Without scope a screen reader guesses which header a value belongs to, and
   * in a table with a row header it guesses wrong. */
  it('scopes a column header to its column and a row header to its row', () => {
    render(
      <Table>
        <THead><Tr><Th>Invoice</Th></Tr></THead>
        <TBody><Tr><Th scope="row">INV-1041</Th></Tr></TBody>
      </Table>,
    )
    expect(screen.getByRole('columnheader', { name: 'Invoice' })).toHaveAttribute('scope', 'col')
    expect(screen.getByRole('rowheader', { name: 'INV-1041' })).toHaveAttribute('scope', 'row')
  })

  /* A total in <TBody> is one more record to anything that reads structure. */
  it('puts the totals row in a real tfoot', () => {
    render(
      <Table>
        <TBody><Tr><Td>4,820</Td></Tr></TBody>
        <TFoot><Tr><Td>Total 4,820</Td></Tr></TFoot>
      </Table>,
    )
    expect(screen.getByRole('cell', { name: 'Total 4,820' }).closest('tfoot')).not.toBeNull()
  })

  it('opens a row in place, and says so', async () => {
    const user = userEvent.setup()
    const Row = () => {
      const [open, setOpen] = useState(false)
      return (
        <Table>
          <TBody>
            <Tr>
              <TdExpand expanded={open} onToggle={() => setOpen(!open)} label="Show terms for INV-1041" />
              <Th scope="row">INV-1041</Th>
            </Tr>
            {open && <TrDetail colSpan={2}>Net 30</TrDetail>}
          </TBody>
        </Table>
      )
    }
    render(<Row />)

    const toggle = screen.getByRole('button', { name: 'Show terms for INV-1041' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Net 30')).toBeNull()

    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Net 30')).toBeInTheDocument()
  })

  /* The whole heading is the control: a 16px chevron is not a target, and a
   * collapsed group still has to say what it is holding. */
  it('collapses a group from its own heading, count and all', async () => {
    const onToggle = vi.fn()
    const user = userEvent.setup()
    render(
      <Table>
        <TBody>
          <TrGroup label="Overdue" count={4} expanded onToggle={onToggle} colSpan={2} />
          <Tr><Td>INV-1041</Td><Td>4,820</Td></Tr>
        </TBody>
      </Table>,
    )

    const heading = screen.getByRole('button', { name: /Overdue/ })
    expect(heading).toHaveAttribute('aria-expanded', 'true')
    expect(heading).toHaveTextContent('4')

    await user.click(heading)
    expect(onToggle).toHaveBeenCalledOnce()
  })

  it('spans the whole table when it has nothing to show, and while it is loading', () => {
    const { rerender } = render(
      <Table>
        <THead><Tr><Th>Invoice</Th><Th>Amount</Th></Tr></THead>
        <TBody><TableEmpty colSpan={2}>No invoices match these filters</TableEmpty></TBody>
      </Table>,
    )
    expect(screen.getByRole('cell', { name: 'No invoices match these filters' })).toHaveAttribute('colspan', '2')

    rerender(
      <Table>
        <THead><Tr><Th>Invoice</Th><Th>Amount</Th></Tr></THead>
        <TableSkeleton columns={2} rows={3} />
      </Table>,
    )
    /* The shimmer is decorative: it is hidden from assistive technology, so the
     * loading state is announced once on the region rather than nine times. */
    expect(screen.getAllByRole('row')).toHaveLength(1)
  })
})
