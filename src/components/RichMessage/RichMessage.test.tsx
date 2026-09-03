import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RichMessage } from './RichMessage'

/* What a model wrote, rendered as the structure it meant rather than as one
 * paragraph with asterisks in it. Every block becomes the real element, because
 * a list read as prose is a list nobody can skim and a code block read as prose
 * is unreadable. */

describe('RichMessage', () => {
  it('is one paragraph when there is no structure to render', () => {
    const { container } = render(<RichMessage text="Two sentences, no structure." />)
    expect(container.querySelector('p')).toHaveTextContent('Two sentences, no structure.')
  })

  it('renders a list as a list, ordered or not', () => {
    const { container, rerender } = render(
      <RichMessage text="" blocks={[{ t: 'li', items: ['one', 'two'] }]} />,
    )
    expect(container.querySelector('ul')?.querySelectorAll('li')).toHaveLength(2)

    rerender(<RichMessage text="" blocks={[{ t: 'li', ordered: true, items: ['one', 'two'] }]} />)
    expect(container.querySelector('ol')).toBeInTheDocument()
  })

  it('renders code as code and a quote as a quote', () => {
    const { container } = render(
      <RichMessage text="" blocks={[{ t: 'code', text: 'npm run check' }, { t: 'quote', text: 'Measured.' }]} />,
    )
    expect(container.querySelector('pre code')).toHaveTextContent('npm run check')
    expect(container.querySelector('blockquote')).toHaveTextContent('Measured.')
  })

  /* No blocks and NO blocks array are the same case, and both mean "this is
   * plain text": an empty array rendering an empty div would show a message
   * that has nothing in it where the words were. */
  it('falls back to the plain text for an empty block list as well as a missing one', () => {
    const { container, rerender } = render(<RichMessage text="Just words." blocks={[]} />)
    expect(container.querySelector('p')).toHaveTextContent('Just words.')

    rerender(<RichMessage text="Just words." />)
    expect(container.querySelector('p')).toHaveTextContent('Just words.')
  })

  it('renders a rule as a rule rather than as a line of characters', () => {
    const { container } = render(<RichMessage text="" blocks={[{ t: 'hr' }]} />)
    expect(container.querySelector('hr')).toBeInTheDocument()
  })

  it('keeps the blocks in the order they were written', () => {
    const { container } = render(
      <RichMessage text="" blocks={[{ t: 'h', text: 'First' }, { t: 'p', text: 'Second' }]} />,
    )
    expect(container.textContent).toBe('FirstSecond')
    expect(screen.getByText('First')).toBeInTheDocument()
  })
})
