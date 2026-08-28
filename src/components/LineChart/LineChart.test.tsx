import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LineChart } from './LineChart'

const MONTHS = ['Apr', 'May', 'Jun']

/* jsdom lays nothing out, so the plot measures 0x0 and the crosshair has no
 * geometry to work from. One fixed box is enough to prove the arithmetic that
 * turns a pointer position into a point index. */
function withPlotWidth(width: number) {
  return vi
    .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
    .mockReturnValue({ x: 0, y: 0, top: 0, left: 0, right: width, bottom: 100, width, height: 100, toJSON: () => ({}) })
}

describe('LineChart', () => {
  it('publishes the numbers as a table, which is what a screen reader reads', () => {
    render(<LineChart labels={MONTHS} series={[{ label: 'Closed', values: [34, 41, 28] }]} label="Findings closed" />)
    expect(screen.getByRole('table', { name: 'Findings closed' })).toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: 'May' })).toBeInTheDocument()
  })

  it('reads every series at the x the pointer is nearest', async () => {
    const rect = withPlotWidth(300)
    const user = userEvent.setup()
    const { container } = render(
      <LineChart
        labels={MONTHS}
        series={[{ label: 'Raised', values: [52, 61, 48] }, { label: 'Closed', values: [34, 41, 28] }]}
        label="Findings"
      />,
    )
    const plot = container.querySelector('.line-chart-plot') as HTMLElement

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

  it('draws a legend once there is more than one line, so colour is never the only clue', () => {
    const { rerender, container } = render(
      <LineChart labels={MONTHS} series={[{ label: 'Closed', values: [1, 2, 3] }]} label="Findings" />,
    )
    expect(container.querySelector('.chart-legend')).toBeNull()

    rerender(
      <LineChart
        labels={MONTHS}
        series={[{ label: 'Closed', values: [1, 2, 3] }, { label: 'Raised', values: [3, 2, 1] }]}
        label="Findings"
      />,
    )
    expect(container.querySelector('.chart-legend')).not.toBeNull()
  })
})
