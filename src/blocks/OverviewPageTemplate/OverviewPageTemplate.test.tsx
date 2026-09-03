import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { OverviewPageTemplate } from './OverviewPageTemplate'

/* The screen somebody lands on. It is a stack of named zones, and the zones are
 * the decision: what is the one thing (prime), what is the row of numbers
 * (band), what needs attention now (notices). Each is optional and each must be
 * absent rather than empty, or the page grows bands of nothing. */

const page = (props: Partial<Parameters<typeof OverviewPageTemplate>[0]> = {}) =>
  render(
    <MemoryRouter>
      <OverviewPageTemplate title="Today" {...props}>
        <div>the rest</div>
      </OverviewPageTemplate>
    </MemoryRouter>,
  )

describe('OverviewPageTemplate', () => {
  it('names the page once', () => {
    page()
    expect(screen.getByRole('heading', { level: 1, name: 'Today' })).toBeInTheDocument()
  })

  it('carries the zones it was given, and nothing where it was given nothing', () => {
    const { container } = page()
    expect(container.querySelector('.overview-band')).toBeNull()
    expect(container.querySelector('.overview-prime')).toBeNull()
    expect(screen.getByText('the rest')).toBeInTheDocument()
  })

  it('shows the band and the one thing when there are any', () => {
    page({ band: <div>four numbers</div>, prime: <div>the one thing</div>, notices: <div>one alert</div> })
    expect(screen.getByText('four numbers')).toBeInTheDocument()
    expect(screen.getByText('the one thing')).toBeInTheDocument()
    expect(screen.getByText('one alert')).toBeInTheDocument()
  })

  it('shows the empty state instead of the zones when there is nothing yet', () => {
    page({ isEmpty: true, emptyState: { title: 'Nothing here yet' } })
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument()
    expect(screen.queryByText('the rest')).not.toBeInTheDocument()
  })

  it('puts the board above the grid when a screen passes one', () => {
    const { container } = render(
      <MemoryRouter>
        <OverviewPageTemplate title="This quarter" board={<div>the board</div>}>
          <div>the widgets</div>
        </OverviewPageTemplate>
      </MemoryRouter>,
    )
    expect(container.querySelector('.overview-board')).toHaveTextContent('the board')
  })
})
