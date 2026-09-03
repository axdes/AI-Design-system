import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SystemPageTemplate } from './SystemPageTemplate'

/* The page a person reaches when the product cannot do what they asked: not
 * found, no permission, something broke. The rule is that it never dead-ends —
 * there is always a way onward, because a page that only apologises leaves the
 * reader with the browser's back button and a guess. */

describe('SystemPageTemplate', () => {
  it('says what happened, once, as the page title', () => {
    render(<MemoryRouter><SystemPageTemplate title="Page not found" /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  })

  it('carries the way onward it was given', () => {
    render(
      <MemoryRouter>
        <SystemPageTemplate title="Page not found" action={<button>Back to sessions</button>} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('button', { name: 'Back to sessions' })).toBeInTheDocument()
  })

  it('carries a way to reach a person when one is offered', () => {
    render(
      <MemoryRouter>
        <SystemPageTemplate title="Something went wrong" contact={<a href="mailto:help@example.com">Contact support</a>} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: 'Contact support' })).toBeInTheDocument()
  })
})
