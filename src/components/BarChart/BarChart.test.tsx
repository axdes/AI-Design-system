import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BarChart } from './BarChart'

const CLOSED = [
  { label: 'Apr', value: 34 },
  { label: 'Jul', value: 47 },
  { label: 'Aug', value: 52 },
]

describe('BarChart', () => {
  it('gives every column a readable name, so a keyboard gets what the pointer gets', () => {
    render(<BarChart data={CLOSED} label="Findings closed" />)
    expect(screen.getByRole('button', { name: 'Aug: 52' })).toBeInTheDocument()
  })

  it('shows the readout on focus and moves it with the focus', async () => {
    const user = userEvent.setup()
    const { container } = render(<BarChart data={CLOSED} label="Findings closed" />)
    /* Read off the readout element, not off the page: the sr-only table carries
     * the same numbers, so a text query would pass with no readout at all. */
    const readout = () => container.querySelector('.chart-readout')

    await user.tab()
    expect(screen.getByRole('button', { name: 'Apr: 34' })).toHaveFocus()
    expect(readout()).toHaveTextContent('Apr')
    expect(readout()).toHaveTextContent('34')

    await user.tab()
    expect(readout()).toHaveTextContent('Jul')
    expect(readout()).not.toHaveTextContent('34')
  })

  it('publishes the numbers as a table, which is what a screen reader reads', () => {
    render(<BarChart data={CLOSED} label="Findings closed" />)
    const table = screen.getByRole('table', { name: 'Findings closed' })
    expect(table).toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: 'Jul' })).toBeInTheDocument()
  })

  it('names each measure in the readout when there are several', async () => {
    const user = userEvent.setup()
    render(
      <BarChart
        data={[{ label: 'Apr', values: [12, 5] }, { label: 'May', values: [9, 3] }]}
        series={[{ label: 'Open' }, { label: 'Overdue' }]}
        label="Findings by state"
      />,
    )
    await user.tab()
    expect(screen.getByRole('button', { name: 'Apr: Open 12, Overdue 5' })).toHaveFocus()
  })

  it('scales to a nice round top rather than to the tallest bar', () => {
    render(<BarChart data={[{ label: 'Apr', value: 34 }]} label="Findings closed" />)
    /* 34 is drawn against 40, not against itself: a bar that always touches the
     * ceiling says nothing about how big it is. */
    expect(screen.getByText('40')).toBeInTheDocument()
  })
})
