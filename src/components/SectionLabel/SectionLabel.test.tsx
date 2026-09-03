import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SectionLabel } from './SectionLabel'

/* The small heavy label over a run of content. Its whole contract is the
 * element it renders as, and the default is the SAFE one rather than the right
 * one: without `as` it is a div, so a label that is not part of the outline
 * cannot silently become an h2 in the middle of a page. The contract says to
 * give `as` explicitly, and a screen that forgets it loses nothing but a
 * heading it never declared. */

describe('SectionLabel', () => {
  it('is not a heading unless somebody said which level it is', () => {
    render(<SectionLabel>Recent</SectionLabel>)
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
    expect(screen.getByText('Recent').tagName).toBe('DIV')
  })

  it('takes the level the outline needs when it is given one', () => {
    render(<SectionLabel as="h3">Recent</SectionLabel>)
    expect(screen.getByRole('heading', { level: 3, name: 'Recent' })).toBeInTheDocument()
  })
})
