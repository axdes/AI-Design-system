import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Descriptions } from './Descriptions'

/* Facts about one thing, as a real description list. The markup IS the meaning
 * here: a term and its value paired in the DOM is what lets a screen reader say
 * "Owner: Ada" instead of reading two unrelated pieces of text. */

describe('Descriptions', () => {
  it('pairs every term with its value in a real description list', () => {
    const { container } = render(
      <Descriptions items={[{ term: 'Owner', value: 'Ada Lovelace' }, { term: 'Status', value: 'Active' }]} />,
    )
    expect(container.querySelector('dl')).toBeInTheDocument()
    expect(container.querySelectorAll('dt')).toHaveLength(2)
    expect(container.querySelectorAll('dd')).toHaveLength(2)
    expect(screen.getByText('Owner').nextElementSibling).toHaveTextContent('Ada Lovelace')
  })

  it('takes a value that is not a string, because a status is a component', () => {
    render(<Descriptions items={[{ term: 'Status', value: <span>Active</span> }]} />)
    expect(screen.getByText('Active').tagName).toBe('SPAN')
  })

  it('is an empty list rather than an error when there are no facts yet', () => {
    const { container } = render(<Descriptions items={[]} />)
    expect(container.querySelector('dl')).toBeEmptyDOMElement()
  })
})
