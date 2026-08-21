import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Carousel } from './Carousel'

/* A carousel is mostly invisible contract: which slide is current, whether the
 * dots say so out loud, and whether it keeps moving while someone is reading it. */

const ITEMS = [
  { id: 'a', content: <p>First</p> },
  { id: 'b', content: <p>Second</p> },
  { id: 'c', content: <p>Third</p> },
]

const dots = () => screen.getAllByRole('button', { name: /Stories, / })

afterEach(() => { vi.useRealTimers() })

describe('Carousel', () => {
  it('names itself and every slide', () => {
    render(<Carousel items={ITEMS} label="Stories" />)

    /* A <section> with a name is a landmark region, which is the APG's own
       carousel container role: findable from a screen reader's landmark list. */
    expect(screen.getByRole('region', { name: 'Stories' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: '1 / 3' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: '3 / 3' })).toBeInTheDocument()
  })

  it('marks the current slide with aria-current, not colour alone', async () => {
    const user = userEvent.setup()
    render(<Carousel items={ITEMS} label="Stories" />)

    expect(dots()[0]).toHaveAttribute('aria-current', 'true')

    await user.click(dots()[2])
    expect(dots()[2]).toHaveAttribute('aria-current', 'true')
    expect(dots()[0]).not.toHaveAttribute('aria-current')
  })

  it('wraps around at both ends', async () => {
    const user = userEvent.setup()
    render(<Carousel items={ITEMS} label="Stories" />)

    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(dots()[2]).toHaveAttribute('aria-current', 'true')

    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(dots()[0]).toHaveAttribute('aria-current', 'true')
  })

  it('renders every slide, so the content is findable and printable', () => {
    render(<Carousel items={ITEMS} label="Stories" />)

    expect(screen.getByText('First')).toBeInTheDocument()
    expect(screen.getByText('Second')).toBeInTheDocument()
    expect(screen.getByText('Third')).toBeInTheDocument()
  })

  it('renders nothing for an empty list', () => {
    const { container } = render(<Carousel items={[]} label="Stories" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('advances on its own when autoPlay is set', () => {
    vi.useFakeTimers()
    render(<Carousel items={ITEMS} label="Stories" autoPlay={3000} />)

    act(() => { vi.advanceTimersByTime(3000) })
    expect(dots()[1]).toHaveAttribute('aria-current', 'true')
  })

  it('stops while the pointer is inside it', () => {
    vi.useFakeTimers()
    render(<Carousel items={ITEMS} label="Stories" autoPlay={3000} />)

    act(() => { screen.getByRole('region', { name: 'Stories' }).dispatchEvent(new MouseEvent('mouseover', { bubbles: true })) })
    act(() => { vi.advanceTimersByTime(9000) })

    expect(dots()[0]).toHaveAttribute('aria-current', 'true')
  })
})
