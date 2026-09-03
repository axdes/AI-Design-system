import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DonutChart } from './DonutChart'

const SEGMENTS = [
  { label: 'Closed', value: 214, tone: 'success' as const },
  { label: 'Open', value: 78, tone: 'warning' as const },
  { label: 'Overdue', value: 28, tone: 'danger' as const },
]

describe('DonutChart', () => {
  it('reads the share under the pointer in the hole, and gives the total back afterwards', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <DonutChart segments={SEGMENTS} center="320" caption="findings" label="Findings by state" />,
    )
    const hole = () => container.querySelector('.donut-chart-center')
    expect(hole()).toHaveTextContent('320')
    expect(hole()).toHaveTextContent('findings')

    /* The legend row is the same control as its arc, and a 5px arc is not a hit
     * area anybody can use. */
    const row = container.querySelectorAll('.donut-chart-legend > li')[1]
    await user.hover(row)
    expect(hole()).toHaveTextContent('78')
    expect(hole()).toHaveTextContent('Open')

    await user.unhover(row)
    expect(hole()).toHaveTextContent('320')
  })

  it('names every share in the accessible name, so the ring is not colour alone', () => {
    render(<DonutChart segments={SEGMENTS} label="Findings by state" />)
    expect(screen.getByRole('img', { name: /Findings by state: Closed 214, Open 78, Overdue 28/ })).toBeInTheDocument()
  })

  it('prints each share as a percentage when asked', () => {
    render(<DonutChart segments={SEGMENTS} percent label="Findings by state" />)
    /* 214 of 320 is 67%, rounded — the number a reader would say out loud. */
    expect(screen.getByText('67%')).toBeInTheDocument()
  })

  it('renders nothing rather than a divide by zero when every share is zero', () => {
    const { container } = render(<DonutChart segments={[{ label: 'None', value: 0 }]} label="Empty" />)
    expect(container.firstChild).toBeNull()
  })

  it('drops the legend when asked, and formats its values in the given locale', () => {
    const segments = [{ label: 'Direct', value: 1234.5 }, { label: 'Search', value: 1000 }]
    const { container, unmount } = render(<DonutChart label="Traffic" segments={segments} locale="de-DE" />)
    expect(container.querySelector('.donut-chart-legend')).toBeInTheDocument()
    expect(screen.getAllByText(/1\.234,5/).length).toBeGreaterThan(0)
    unmount()

    const { container: bare } = render(<DonutChart label="Traffic" segments={segments} legend={false} />)
    expect(bare.querySelector('.donut-chart-legend')).toBeNull()
  })
})
