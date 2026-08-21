import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
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
})
