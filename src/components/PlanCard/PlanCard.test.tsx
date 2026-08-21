import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PlanCard } from './PlanCard'

/* What a screenshot cannot check: that the feature list is a real list, so a
 * screen reader can say how many things a plan includes before reading them. */

describe('PlanCard', () => {
  it('renders the features as a real list', () => {
    render(
      <PlanCard name="Team" price="$12" features={['A', 'B', 'C']} action={<button type="button">Pick</button>} />,
    )

    expect(screen.getByRole('list')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })

  it('gives the plan a heading, not a styled div', () => {
    render(<PlanCard name="Team" price="$12" features={[]} action={<button type="button">Pick</button>} />)
    expect(screen.getByRole('heading', { name: 'Team' })).toBeInTheDocument()
  })

  it('marks the recommended plan in text as well as in the border', () => {
    const { container, rerender } = render(
      <PlanCard name="Business" price="$29" features={[]} action={<button type="button">Pick</button>} recommended />,
    )
    expect(screen.getByText('Recommended')).toBeInTheDocument()
    expect(container.querySelector('.plan-card')).toHaveAttribute('data-recommended', 'true')

    rerender(<PlanCard name="Business" price="$29" features={[]} action={<button type="button">Pick</button>} />)
    expect(screen.queryByText('Recommended')).toBeNull()
    expect(container.querySelector('.plan-card')).not.toHaveAttribute('data-recommended')
  })

  it('shows the period beside the price only when there is one', () => {
    const { rerender } = render(
      <PlanCard name="Team" price="$12" period="per month" features={[]} action={<button type="button">Pick</button>} />,
    )
    expect(screen.getByText('per month')).toBeInTheDocument()

    rerender(<PlanCard name="Team" price="$12" features={[]} action={<button type="button">Pick</button>} />)
    expect(screen.queryByText('per month')).toBeNull()
  })
})
