import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Pagination } from './Pagination'

describe('Pagination', () => {
  it('renders nothing for a single page', () => {
    const { container } = render(<Pagination page={1} pageCount={1} onChange={() => undefined} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('marks the current page and disables the edge arrow', () => {
    render(<Pagination page={1} pageCount={5} onChange={() => undefined} />)
    expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next page' })).toBeEnabled()
  })

  it('collapses long ranges with gaps but always shows first and last', () => {
    render(<Pagination page={6} pageCount={12} onChange={() => undefined} />)
    /* first, last and the window around 6 are present; the far pages are not. */
    expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Page 12' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Page 6' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Page 3' })).toBeNull()
  })

  it('drives the page through onChange', async () => {
    const user = userEvent.setup()
    function Host() {
      const [page, setPage] = useState(2)
      return (
        <>
          <Pagination page={page} pageCount={9} onChange={setPage} />
          <output>{page}</output>
        </>
      )
    }
    render(<Host />)

    await user.click(screen.getByRole('button', { name: 'Next page' }))
    expect(screen.getByRole('status')).toHaveTextContent('3')

    await user.click(screen.getByRole('button', { name: 'Page 1' }))
    expect(screen.getByRole('status')).toHaveTextContent('1')
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled()
  })

  it('never moves past the ends', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Pagination page={3} pageCount={3} onChange={onChange} />)

    /* On the last page the Next arrow is disabled, so it cannot overshoot. */
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Page 1' }))
    expect(onChange).toHaveBeenCalledWith(1)
  })

  /* A mutation test removed this component's aria-label and the whole suite —
     471 tests, axe over every golden example — stayed green (2026-08-26). The
     examples give the control a name another way, so axe is satisfied there and
     the standalone case, which is how a product uses it, went unchecked. The
     name IS the contract for a control whose label is not text beside it. */
  it('names the navigation region, so a page with two of them is walkable', () => {
    render(<Pagination page={2} pageCount={5} onChange={() => {}} label="Search results" />)
    expect(screen.getByRole('navigation', { name: 'Search results' })).toBeInTheDocument()
  })

  /* AN ELLIPSIS STANDS FOR SOMETHING SKIPPED. The gap is pushed only when the
     window really starts past page 2 — `start > first + 1`. Widened to `>=`, an
     ellipsis appears between 1 and 2 with nothing hidden behind it, which tells
     the reader pages are missing that are right there. A mutation run widened it
     and nothing failed (2026-08-29). */
  it('draws no ellipsis when nothing is skipped', () => {
    /* Page 3 of 5 with one sibling either side: the window is 2..4, so 1 2 3 4 5
       are all listed and neither end hides anything. `start` is exactly
       `first + 1` here, which is the boundary the guard turns on. */
    const { container } = render(<Pagination page={3} pageCount={5} onChange={() => undefined} />)
    expect(container.querySelectorAll('.pagination-gap')).toHaveLength(0)
    for (const n of ['1', '2', '3', '4', '5']) {
      expect(screen.getByRole('button', { name: new RegExp(`\\b${n}\\b`) })).toBeInTheDocument()
    }
  })

  /* The three props a translated pagination needs, and the only place they are
     ever seen: the arrows are icon-only, so their words live in an aria-label
     and a tooltip and nowhere on screen. */
  it('says the arrows and sizes the window in the caller’s words', () => {
    render(
      <Pagination
        page={5}
        pageCount={20}
        onChange={() => undefined}
        siblingCount={2}
        prevLabel="Föregående sida"
        nextLabel="Nästa sida"
      />,
    )
    expect(screen.getByRole('button', { name: 'Föregående sida' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nästa sida' })).toBeInTheDocument()
    /* Two either side of 5, so 3..7 are listed and 8 is not. */
    for (const n of ['3', '4', '5', '6', '7']) {
      expect(screen.getByRole('button', { name: new RegExp(`\\b${n}\\b`) })).toBeInTheDocument()
    }
    expect(screen.queryByRole('button', { name: /\b8\b/ })).toBeNull()
  })
})
