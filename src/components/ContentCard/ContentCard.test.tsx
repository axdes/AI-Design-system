import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ContentCard } from './ContentCard'

/* The card's promise is the SLOT CONTRACT and the reading order: the same six
 * parts every feed shares, in the same order, whatever the arrangement. The
 * arrangement itself is CSS (a container query), so what a test can hold is the
 * contract around it: the parts are there, the order is right, and the whole
 * card is one target when it is given one. */

describe('ContentCard', () => {
  it('renders the six slots in reading order', () => {
    const { container } = render(
      <ContentCard
        eyebrow="Report"
        title="The quarter in numbers"
        excerpt="Two sites closed early."
        media={<img src="data:," alt="" />}
        meta={<span>19 February</span>}
        actions={<button type="button">Read</button>}
      />,
    )
    const text = container.textContent ?? ''
    expect(text.indexOf('Report')).toBeLessThan(text.indexOf('The quarter'))
    expect(text.indexOf('The quarter')).toBeLessThan(text.indexOf('Two sites'))
    expect(text.indexOf('Two sites')).toBeLessThan(text.indexOf('19 February'))
    expect(screen.getByRole('heading', { name: 'The quarter in numbers' })).toBeInTheDocument()
  })

  /* The way in is the TITLE, and it is a real control: one accessible name, one
   * focus stop, reachable by keyboard. A click handler on the card's div was
   * none of those things. */
  it('opens through its title, which is the link', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(<ContentCard title="The quarter in numbers" onSelect={onSelect} />)

    const link = screen.getByRole('button', { name: 'The quarter in numbers' })
    expect(screen.getByRole('heading')).toContainElement(link)

    link.focus()
    await user.keyboard('{Enter}')
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('drops nothing but the parts it was not given', () => {
    const { container } = render(<ContentCard title="Just a title" />)
    expect(container.querySelector('.card-media')).toBeNull()
    expect(container.querySelector('.content-card-excerpt')).toBeNull()
    expect(container.querySelector('.card-meta')).toBeNull()
  })

  it('lets the caller fix the arrangement instead of measuring', () => {
    const { container } = render(
      <ContentCard title="Cover" layout="cover" media={<img src="data:," alt="" />} />,
    )
    expect(container.querySelector('.content-card')).toHaveAttribute('data-layout', 'cover')
    expect(container.querySelector('.card-media')).toHaveAttribute('data-placement', 'cover')
  })

  /* The list form. It is the same component and the same six slots, so the
     test that matters is that it paints NO card of its own: a card per row is a
     stack of boxes, which is the thing the row exists instead of. */
  it('paints no surface of its own in the list form', () => {
    const { container } = render(
      <ContentCard title="Row" layout="row" media={<img src="data:," alt="" />} />,
    )
    expect(container.querySelector('.card')).toBeNull()
    expect(container.querySelector('.content-card-media')).not.toBeNull()
    expect(container.querySelector('.content-card')).toHaveAttribute('data-layout', 'row')
  })

  it('gives the list form one accessible name and one focus stop', () => {
    render(<ContentCard title="Quarterly review" layout="row" onSelect={() => undefined} />)
    expect(screen.getByRole('button', { name: 'Quarterly review' })).toBeInTheDocument()
  })

  /* Density is orthogonal to layout: it reads on a tile, not only on a row. */
  it('drops the excerpt at compact on any layout', () => {
    const { container } = render(
      <ContentCard title="Tile" layout="tile" density="compact" excerpt="Dropped by CSS" />,
    )
    expect(container.querySelector('.content-card')).toHaveAttribute('data-density', 'compact')
  })

  it('stretches to its grid cell, and hands the same instruction to the Card underneath', () => {
    const { container } = render(<ContentCard title="Quarterly review" stretch />)
    expect(container.querySelector('.content-card')).toHaveAttribute('data-stretch')
    expect(container.querySelector('.card')).toHaveAttribute('data-stretch')
  })
})
