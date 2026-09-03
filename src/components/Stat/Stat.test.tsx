import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Stat } from './Stat'

/* One number with its name under it. The delta is the part that carries a
 * judgement, and the judgement is the caller's: a queue growing is bad news and
 * revenue growing is good, and the same arrow says both. */

describe('Stat', () => {
  it('shows the number and what it is the number OF', () => {
    render(<Stat value="1,204" label="Sessions this week" />)
    expect(screen.getByText('1,204')).toBeInTheDocument()
    expect(screen.getByText('Sessions this week')).toBeInTheDocument()
  })

  it('leaves out the delta entirely when there is none, rather than showing a zero', () => {
    const { container } = render(<Stat value="1,204" label="Sessions" />)
    expect(container.querySelector('.stat-delta')).toBeNull()
  })

  /* Direction and tone are separate props on purpose, and the test says so:
   * "up" and "bad" is a real combination, and a component that derived the tone
   * from the arrow could not express it. */
  it('keeps the direction and the meaning apart', () => {
    const { container } = render(<Stat value="42" label="Open incidents" delta="+8" deltaDirection="up" deltaTone="danger" />)
    const delta = container.querySelector('.stat-delta')
    expect(delta).toHaveAttribute('data-delta-direction', 'up')
    expect(delta).toHaveAttribute('data-delta-tone', 'danger')
    expect(delta).toHaveTextContent('+8')
  })

  it('carries a unit beside the value rather than inside it', () => {
    const { container } = render(<Stat value="62" unit="GB" label="Storage used" />)
    expect(container.querySelector('.stat-unit')).toHaveTextContent('GB')
  })
})
