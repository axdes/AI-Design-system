import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Chart } from './Chart'

const MONTHS = ['Apr', 'Jul', 'Aug']
const CLOSED = [{ label: 'Closed', values: [34, 47, 52] }]

/* jsdom lays nothing out, so the plot measures 0x0 and the crosshair has no
 * geometry to work from. One fixed box is enough to prove the arithmetic that
 * turns a pointer position into a point index. */
function withPlotWidth(width: number) {
  return vi
    .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
    .mockReturnValue({ x: 0, y: 0, top: 0, left: 0, right: width, bottom: 100, width, height: 100, toJSON: () => ({}) })
}

describe('Chart, bars', () => {
  it('gives every column a readable name, so a keyboard gets what the pointer gets', () => {
    render(<Chart categories={MONTHS} series={CLOSED} label="Findings closed" />)
    expect(screen.getByRole('button', { name: 'Aug: 52' })).toBeInTheDocument()
  })

  it('shows the readout on focus and moves it with the focus', async () => {
    const user = userEvent.setup()
    const { container } = render(<Chart categories={MONTHS} series={CLOSED} label="Findings closed" />)
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

  it('names each measure in the readout when there are several', async () => {
    const user = userEvent.setup()
    render(
      <Chart
        categories={['Apr', 'May']}
        series={[{ label: 'Open', values: [12, 9] }, { label: 'Overdue', values: [5, 3] }]}
        label="Findings by state"
      />,
    )
    await user.tab()
    expect(screen.getByRole('button', { name: 'Apr: Open 12, Overdue 5' })).toHaveFocus()
  })

  it('scales to a nice round top rather than to the tallest bar', () => {
    render(<Chart categories={['Apr']} series={[{ label: 'Closed', values: [34] }]} label="Findings closed" />)
    /* 34 is drawn against 40, not against itself: a bar that always touches the
     * ceiling says nothing about how big it is. */
    expect(screen.getByText('40')).toBeInTheDocument()
  })
})

describe('Chart, line', () => {
  it('reads every series at the x the pointer is nearest', async () => {
    const rect = withPlotWidth(300)
    const user = userEvent.setup()
    const { container } = render(
      <Chart
        type="line"
        categories={['Apr', 'May', 'Jun']}
        series={[{ label: 'Raised', values: [52, 61, 48] }, { label: 'Closed', values: [34, 41, 28] }]}
        label="Findings"
      />,
    )
    const plot = container.querySelector('.chart-line-plot') as HTMLElement

    /* The far right of a three-point chart is the third point. The numbers are
     * read off the readout itself: the table underneath carries them too, and a
     * plain text query would pass without the crosshair working at all. */
    await user.pointer({ target: plot, coords: { clientX: 300, clientY: 50 } })
    const readout = () => container.querySelector('.chart-readout')
    expect(readout()).toHaveTextContent('Jun')
    expect(readout()).toHaveTextContent('48')
    expect(readout()).toHaveTextContent('28')

    await user.unhover(plot)
    expect(readout()).toBeNull()
    rect.mockRestore()
  })

  it('draws a legend once there is more than one measure, so colour is never the only clue', () => {
    const { rerender, container } = render(
      <Chart type="line" categories={['Apr', 'May', 'Jun']} series={[{ label: 'Closed', values: [1, 2, 3] }]} label="Findings" />,
    )
    expect(container.querySelector('.chart-legend')).toBeNull()

    rerender(
      <Chart
        type="line"
        categories={['Apr', 'May', 'Jun']}
        series={[{ label: 'Closed', values: [1, 2, 3] }, { label: 'Raised', values: [3, 2, 1] }]}
        label="Findings"
      />,
    )
    expect(container.querySelector('.chart-legend')).not.toBeNull()
  })
})

describe('Chart, both marks', () => {
  /* One component, so the furniture is proven once for both: the table a screen
   * reader reads is the same code path with a different first column. */
  it.each(['bar', 'line'] as const)('publishes the numbers as a table (%s)', (type) => {
    render(<Chart type={type} categories={MONTHS} series={CLOSED} label="Findings closed" />)
    expect(screen.getByRole('table', { name: 'Findings closed' })).toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: 'Jul' })).toBeInTheDocument()
  })
})
