import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DataGrid } from './DataGrid'

type Row = { id: string; name: string }
const ROWS: Row[] = Array.from({ length: 1000 }, (_, i) => ({ id: String(i), name: `Row ${i}` }))

function grid() {
  return (
    <DataGrid<Row>
      label="Rows"
      rows={ROWS}
      rowKey={(r) => r.id}
      rowHeight={40}
      height={400}
      overscan={2}
      columns={[{ key: 'name', header: 'Name', cell: (r) => r.name }]}
    />
  )
}

describe('DataGrid', () => {
  it('windows: only the visible rows are in the DOM, not all 1000', () => {
    render(grid())
    const rows = screen.getAllByRole('row')
    /* 400px / 40px = 10 visible + overscan*2, plus the header row — far under 1000. */
    expect(rows.length).toBeLessThan(40)
    expect(screen.getByText('Row 0')).toBeInTheDocument()
    expect(screen.queryByText('Row 900')).toBeNull()
  })

  it('renders a different window after scrolling', () => {
    render(grid())
    const body = document.querySelector('.datagrid-body') as HTMLElement
    fireEvent.scroll(body, { target: { scrollTop: 40 * 900 } })
    expect(screen.getByText('Row 900')).toBeInTheDocument()
    expect(screen.queryByText('Row 0')).toBeNull()
  })

  it('reports the full row count on the grid', () => {
    render(grid())
    expect(screen.getByRole('grid', { name: 'Rows' })).toHaveAttribute('aria-rowcount', '1000')
  })

  /* THE GRID CONTRACT. role="grid" promises a composite widget: one tab stop
   * for the whole thing and arrow keys between cells. Before this, the role
   * was there and none of the model was, which is worse than a plain table. */
  it('is one tab stop, and the arrows move the cell that holds it', async () => {
    const user = userEvent.setup()
    render(grid())

    await user.tab()
    const first = screen.getByText('Row 0')
    expect(first).toHaveFocus()
    expect(first).toHaveAttribute('tabindex', '0')

    await user.keyboard('{ArrowDown}')
    expect(screen.getByText('Row 1')).toHaveFocus()
    expect(first).toHaveAttribute('tabindex', '-1')
  })

  /* The one thing a virtualized grid gets wrong that a plain table cannot: the
   * cell the keyboard just stepped onto is not in the DOM yet. */
  it('scrolls the window to the row the keyboard walks to', async () => {
    const user = userEvent.setup()
    render(grid())

    await user.tab()
    await user.keyboard('{Control>}{End}{/Control}')

    expect(screen.getByText('Row 999')).toBeInTheDocument()
    expect(screen.getByText('Row 999')).toHaveFocus()
  })

  it('reports the sort instead of doing it, and says which way', async () => {
    const onSortChange = vi.fn()
    const user = userEvent.setup()
    render(
      <DataGrid<Row>
        label="Rows"
        rows={ROWS}
        rowKey={(r) => r.id}
        sort={{ key: 'name', sortDirection: 'asc' }}
        onSortChange={onSortChange}
        columns={[{ key: 'name', header: 'Name', cell: (r) => r.name, sortable: true }]}
      />,
    )

    expect(screen.getByRole('columnheader', { name: /Name/ })).toHaveAttribute('aria-sort', 'ascending')
    await user.click(screen.getByRole('button', { name: /Name/ }))
    expect(onSortChange).toHaveBeenCalledWith({ key: 'name', sortDirection: 'desc' })
  })

  /* Editing is entered deliberately and commits per cell: a cell that becomes
   * an input on a stray click loses the value that was in it. */
  it('edits a cell on Enter and commits it, and cancels on Escape', async () => {
    const onCellChange = vi.fn()
    const user = userEvent.setup()
    render(
      <DataGrid<Row>
        label="Rows"
        rows={ROWS}
        rowKey={(r) => r.id}
        onCellChange={onCellChange}
        columns={[{ key: 'name', header: 'Name', cell: (r) => r.name, value: (r) => r.name, editable: true }]}
      />,
    )

    await user.tab()
    await user.keyboard('{Enter}')
    const editor = screen.getByRole('textbox', { name: /Edit Name/ })
    await user.clear(editor)
    await user.type(editor, 'Renamed{Escape}')
    expect(onCellChange).not.toHaveBeenCalled()

    await user.keyboard('{F2}')
    await user.clear(screen.getByRole('textbox', { name: /Edit Name/ }))
    await user.type(screen.getByRole('textbox', { name: /Edit Name/ }), 'Renamed{Enter}')
    expect(onCellChange).toHaveBeenCalledWith(ROWS[0], 'name', 'Renamed')
  })

  it('says it has nothing rather than rendering an empty frame', () => {
    render(
      <DataGrid<Row>
        label="Rows"
        rows={[]}
        rowKey={(r) => r.id}
        empty={<p>No rows match these filters</p>}
        columns={[{ key: 'name', header: 'Name', cell: (r) => r.name }]}
      />,
    )
    expect(screen.getByText('No rows match these filters')).toBeInTheDocument()
  })
})

describe('a column with a closed list is chosen, not typed', () => {
  const OPTIONS = ['', 'CONFIRMED'] as const
  const rows = [{ id: '1', state: '' }]
  const columns = [
    { key: 'state', header: 'State', cell: (r: typeof rows[0]) => r.state || 'no', value: (r: typeof rows[0]) => r.state, editable: true, options: OPTIONS },
  ]

  it('is the control itself, with no editor to open first', async () => {
    render(<DataGrid label="States" rows={rows} rowKey={(r) => r.id} columns={columns} onCellChange={() => {}} />)
    /* Present before anything is clicked: one press opens the list, which is
     * the whole interaction a cell like this owes. */
    expect(screen.getByRole('combobox', { name: 'State for row 1' })).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('commits the choice as soon as it is made, and offers only the list', async () => {
    const onCellChange = vi.fn()
    render(<DataGrid label="States" rows={rows} rowKey={(r) => r.id} columns={columns} onCellChange={onCellChange} />)
    const select = screen.getByRole('combobox', { name: 'State for row 1' })
    expect(screen.getAllByRole('option')).toHaveLength(2)
    await userEvent.selectOptions(select, 'CONFIRMED')
    expect(onCellChange).toHaveBeenCalledWith(rows[0], 'state', 'CONFIRMED')
  })

  it('shows a stored value the list does not offer, rather than the first option', () => {
    const typed = [{ id: '1', state: 'Team reorganizing' }]
    render(<DataGrid label="States" rows={typed} rowKey={(r) => r.id} columns={columns} onCellChange={() => {}} />)
    expect(screen.getByRole('combobox', { name: 'State for row 1' })).toHaveValue('Team reorganizing')
  })

  it('walks the grid on an arrow rather than changing the value under the pointer', async () => {
    const onCellChange = vi.fn()
    const two = [{ id: '1', state: '' }, { id: '2', state: '' }]
    render(<DataGrid label="States" rows={two} rowKey={(r) => r.id} columns={columns} onCellChange={onCellChange} />)
    const select = screen.getAllByRole('combobox')[0]!
    select.focus()
    await userEvent.keyboard('{ArrowDown}')
    expect(onCellChange).not.toHaveBeenCalled()
    expect(screen.getAllByRole('combobox')[1]).toHaveFocus()
  })
})

describe("a column of sentences gets a second line", () => {
  const rows = [{ id: '1', note: 'A long sentence about what this team is building, which does not fit one line.' }]
  const columns = [{ key: 'note', header: 'Note', cell: (r: typeof rows[0]) => r.note, wrap: true }]

  it('puts the text in a box the clamp can apply to', () => {
    const { container } = render(<DataGrid label="Notes" rows={rows} rowKey={(r) => r.id} columns={columns} />)
    const cell = container.querySelector('[data-wrap]')
    expect(cell).not.toBeNull()
    expect(cell?.querySelector('.datagrid-clamp')?.textContent).toBe(rows[0].note)
  })

  /* Without this the whole grid wraps, and a one-line column of codes becomes two lines of one
   * word. Wrapping is asked for per column. */
  it('leaves every other column on one line', () => {
    const { container } = render(
      <DataGrid label="Notes" rows={rows} rowKey={(r) => r.id}
        columns={[{ key: 'plain', header: 'Plain', cell: () => 'x' }, ...columns]} />,
    )
    expect(container.querySelectorAll('[data-wrap]')).toHaveLength(1)
    expect(container.querySelectorAll('.datagrid-clamp')).toHaveLength(1)
  })

  /* ONE CLICK, not two. The single click used to do nothing visible, so a
     reader clicked again and reached the editor on the third press (owner,
     2026-08-26). This is the guard on that: a cell that can be edited answers
     the first press. */
  it('opens the editor on a single click', async () => {
    const user = userEvent.setup()
    render(
      <DataGrid<Row>
        label="Rows"
        rows={ROWS}
        rowKey={(r) => r.id}
        columns={[{ key: 'name', header: 'Name', cell: (r) => r.name, value: (r) => r.name, editable: true }]}
      />,
    )
    const cell = screen.getAllByRole('gridcell')[0]
    await user.click(cell)
    expect(screen.getByRole('textbox', { name: /Edit Name/ })).toBeInTheDocument()
  })
})

describe("what became of the cell that was just committed", () => {
  const rows = [{ id: '1', state: '' }]
  const columns = [{ key: 'state', header: 'State', cell: (r: typeof rows[0]) => r.state || 'no', value: (r: typeof rows[0]) => r.state, editable: true, options: ['', 'CONFIRMED'] as const }]

  /* A caller that answers nothing is a caller that does not want to be reported on — which is
   * every grid that existed before this, so it must stay silent. */
  it('says nothing when the caller returns nothing', async () => {
    const { container } = render(<DataGrid label="States" rows={rows} rowKey={(r) => r.id} columns={columns} onCellChange={() => {}} />)
    await userEvent.selectOptions(screen.getByRole('combobox'), 'CONFIRMED')
    expect(container.querySelector('.dg-cell-mark')).toBeNull()
  })

  it('marks the cell written once the caller says it went', async () => {
    const { container } = render(
      <DataGrid label="States" rows={rows} rowKey={(r) => r.id} columns={columns} onCellChange={() => Promise.resolve(null)} />,
    )
    await userEvent.selectOptions(screen.getByRole('combobox'), 'CONFIRMED')
    await waitFor(() => expect(container.querySelector('[data-state="saved"]')).not.toBeNull())
  })

  /* The words the caller resolves with, on the cell they belong to: a grid row has no room for a
   * sentence, so they travel on `title` and to a screen reader. */
  it('keeps the refusal against the cell it was about', async () => {
    render(
      <DataGrid label="States" rows={rows} rowKey={(r) => r.id} columns={columns}
        onCellChange={() => Promise.resolve('Somebody answered first.')} />,
    )
    await userEvent.selectOptions(screen.getByRole('combobox'), 'CONFIRMED')
    await waitFor(() => expect(screen.getByRole('alert')).toHaveAttribute('title', 'Somebody answered first.'))
  })

  /* A mutation test deleted this accessible name and the whole suite — 471
     tests, axe over every golden example — stayed green (2026-08-26). The name
     IS the contract here, and nothing was holding it. */
  it('a cell that failed to save SAYS what went wrong, in words', async () => {
    const user = userEvent.setup()
    render(
      <DataGrid<Row>
        label="Rows"
        rows={ROWS}
        rowKey={(r) => r.id}
        /* The contract: the promise RESOLVES with the message. A rejection is a
           crash, not a rejected value. */
        onCellChange={() => Promise.resolve('Name is already taken')}
        columns={[{ key: 'name', header: 'Name', cell: (r) => r.name, value: (r) => r.name, editable: true }]}
      />,
    )
    await user.tab()
    await user.keyboard('{Enter}')
    const editor = screen.getByRole('textbox', { name: /Edit Name/ })
    await user.clear(editor)
    await user.type(editor, 'Taken{Enter}')
    /* The mark is a glyph: a cell has no room for a sentence. The sentence has
       to reach a screen reader anyway, or the failure is a red dot nobody can
       read. */
    await waitFor(() => expect(screen.getByRole('alert', { name: 'Name is already taken' })).toBeInTheDocument())
  })

})

describe('which way the column is sorted', () => {
  /* THE ARROW HAS TO POINT THE WAY THE COLUMN IS SORTED. `asc` is up and
     everything else is down; a mutation run swapped the two arms and nothing
     failed (2026-08-29), leaving a header that says "ascending" to a screen
     reader and points downward to everyone else. `aria-sort` and the glyph are
     one fact told twice, and the test holds them together. */
  it('points the sort arrow the same way aria-sort says', () => {
    const onSort = vi.fn()
    function Sorted({ dir }: { dir: 'asc' | 'desc' }) {
      return (
        <DataGrid<Row>
          label="Rows"
          rows={ROWS.slice(0, 5)}
          rowKey={(r) => r.id}
          rowHeight={40}
          height={400}
          sort={{ key: 'name', sortDirection: dir }}
          onSortChange={onSort}
          columns={[{ key: 'name', header: 'Name', cell: (r) => r.name, sortable: true }]}
        />
      )
    }
    const glyph = (el: HTMLElement) => el.querySelector('svg')?.getAttribute('class') ?? ''

    const { unmount } = render(<Sorted dir="asc" />)
    const asc = screen.getByRole('columnheader', { name: /Name/ })
    expect(asc).toHaveAttribute('aria-sort', 'ascending')
    expect(glyph(asc)).toContain('lucide-arrow-up')
    unmount()

    render(<Sorted dir="desc" />)
    const desc = screen.getByRole('columnheader', { name: /Name/ })
    expect(desc).toHaveAttribute('aria-sort', 'descending')
    expect(glyph(desc)).toContain('lucide-arrow-down')
  })
})
