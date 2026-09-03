import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ColumnPicker } from './ColumnPicker'

/* Which columns a table shows. The whole of it is one rule: the answer it hands
 * back is in the TABLE's order, not in the order somebody happened to tick
 * things — otherwise turning a column off and on again moves it to the end. */

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'owner', label: 'Owner' },
  { key: 'updated', label: 'Updated' },
]

describe('ColumnPicker', () => {
  it('hands back the columns in the table order, not in the order they were ticked', async () => {
    const onChange = vi.fn()
    render(<ColumnPicker columns={columns} visible={['name', 'updated']} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: /columns/i }))
    await userEvent.click(screen.getByText('Owner'))
    expect(onChange).toHaveBeenCalledWith(['name', 'owner', 'updated'])
  })

  it('turns a column off without disturbing the rest', async () => {
    const onChange = vi.fn()
    render(<ColumnPicker columns={columns} visible={['name', 'owner', 'updated']} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: /columns/i }))
    await userEvent.click(screen.getByText('Owner'))
    expect(onChange).toHaveBeenCalledWith(['name', 'updated'])
  })

  it('keeps its choices behind the trigger until somebody asks', () => {
    render(<ColumnPicker columns={columns} visible={['name']} onChange={vi.fn()} />)
    expect(screen.queryByText('Owner')).not.toBeInTheDocument()
  })

  /* A locked column is the identity column: turning it off leaves a table of
   * rows nobody can tell apart, so it is shown, ticked and not changeable. */
  it('shows a locked column as on and refuses to let it be turned off', async () => {
    const onChange = vi.fn()
    render(
      <ColumnPicker
        columns={[{ key: 'name', label: 'Name', locked: true }, ...columns.slice(1)]}
        visible={['owner']}
        onChange={onChange}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /columns/i }))
    const locked = screen.getByRole('checkbox', { name: 'Name' })
    expect(locked).toBeChecked()
    expect(locked).toBeDisabled()
  })

  /* Reordering exists only where somebody can act on it, and the ends of the
   * list have nowhere to go — an enabled arrow at the top is a control that
   * does nothing, which is worse than an absent one. */
  it('offers the move controls only with a handler, and never past the ends', async () => {
    const { rerender } = render(<ColumnPicker columns={columns} visible={['name']} onChange={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /columns/i }))
    expect(screen.queryByRole('button', { name: /Move Name up/ })).not.toBeInTheDocument()

    rerender(<ColumnPicker columns={columns} visible={['name']} onChange={vi.fn()} onMove={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Move Name up' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Move Name down' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Move Updated down' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Move Updated up' })).toBeEnabled()
  })

  it('moves a column the way it was asked to', async () => {
    const onMove = vi.fn()
    render(<ColumnPicker columns={columns} visible={['name']} onChange={vi.fn()} onMove={onMove} />)
    await userEvent.click(screen.getByRole('button', { name: /columns/i }))
    await userEvent.click(screen.getByRole('button', { name: 'Move Owner up' }))
    expect(onMove).toHaveBeenCalledWith('owner', -1)
  })

  /* A locked column cannot be moved either: its position is part of what makes
   * it the identity column. */
  it('gives a locked column no move controls at all', async () => {
    render(
      <ColumnPicker
        columns={[{ key: 'name', label: 'Name', locked: true }, ...columns.slice(1)]}
        visible={['name']}
        onChange={vi.fn()}
        onMove={vi.fn()}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /columns/i }))
    expect(screen.queryByRole('button', { name: /Move Name/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Move Owner up' })).toBeInTheDocument()
  })

  it('offers a way back to the defaults only when there is one', async () => {
    const onReset = vi.fn()
    const { rerender } = render(<ColumnPicker columns={columns} visible={['name']} onChange={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /columns/i }))
    expect(screen.queryByRole('button', { name: /reset/i })).not.toBeInTheDocument()

    rerender(<ColumnPicker columns={columns} visible={['name']} onChange={vi.fn()} onReset={onReset} />)
    await userEvent.click(screen.getByRole('button', { name: /reset/i }))
    expect(onReset).toHaveBeenCalledOnce()
  })
})
