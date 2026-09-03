import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Timeline } from './Timeline'

/* What happened, in order. The order IS the content, which is why it is an
 * ordered list and not a stack of divs: a screen reader announces "list, 3
 * items" and reads them in sequence. */

describe('Timeline', () => {
  it('is an ordered list, one item per event', () => {
    const { container } = render(
      <Timeline items={[
        { id: 'a', title: 'Created' },
        { id: 'b', title: 'Assigned' },
        { id: 'c', title: 'Closed' },
      ]} />,
    )
    expect(container.querySelector('ol')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })

  it('keeps the events in the order it was given them', () => {
    render(<Timeline items={[{ id: 'a', title: 'Created' }, { id: 'b', title: 'Closed' }]} />)
    const titles = screen.getAllByRole('listitem').map((li) => li.textContent)
    expect(titles[0]).toContain('Created')
    expect(titles[1]).toContain('Closed')
  })

  it('carries a time and a body only where there is one', () => {
    const { container } = render(
      <Timeline items={[
        { id: 'a', title: 'Created', time: '10:00', content: 'by Ada' },
        { id: 'b', title: 'Closed' },
      ]} />,
    )
    expect(screen.getByText('10:00')).toBeInTheDocument()
    expect(container.querySelectorAll('.timeline-content')).toHaveLength(1)
  })

  /* The marker is a shape: a coloured dot announces nothing, and announcing it
   * would put "image" between every two events. */
  it('hides its markers from a screen reader', () => {
    const { container } = render(<Timeline items={[{ id: 'a', title: 'Created', tone: 'success' }]} />)
    expect(container.querySelector('.timeline-marker')).toHaveAttribute('aria-hidden', 'true')
  })
})
