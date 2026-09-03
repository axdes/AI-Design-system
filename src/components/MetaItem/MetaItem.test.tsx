import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MetaItem } from './MetaItem'

/* One fact in a row of facts under a title. It is deliberately almost nothing,
 * and the two things it does own are the ones a caller gets wrong: the icon is
 * optional, and everything else a caller passes has to reach the element so an
 * id or a title from outside still lands. */

describe('MetaItem', () => {
  it('is the fact and nothing else without an icon', () => {
    const { container } = render(<MetaItem>Updated today</MetaItem>)
    expect(screen.getByText('Updated today')).toBeInTheDocument()
    expect(container.querySelector('.icon')).toBeNull()
  })

  it('takes an icon in front of the fact when one is given', () => {
    const { container } = render(<MetaItem icon="search">Updated today</MetaItem>)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('passes anything else through to the element it owns', () => {
    render(<MetaItem id="updated" title="Last change">Updated today</MetaItem>)
    const item = screen.getByText('Updated today')
    expect(item).toHaveAttribute('id', 'updated')
    expect(item).toHaveAttribute('title', 'Last change')
  })
})
