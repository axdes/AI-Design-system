import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Highlight } from './Highlight'

/* Search queries are user input. A component that turns them into a RegExp is
 * one paste of "(((" away from throwing, and one of ".*.*.*" away from hanging. */

describe('Highlight', () => {
  it('marks every occurrence, ignoring case by default', () => {
    const { container } = render(<Highlight text="Onboard, then onboard again" query="onboard" />)

    const marks = container.querySelectorAll('mark')
    expect(marks).toHaveLength(2)
    expect(marks[0]).toHaveTextContent('Onboard')
    expect(marks[1]).toHaveTextContent('onboard')
  })

  it('keeps the original casing of the text it marks', () => {
    const { container } = render(<Highlight text="Onboarding" query="onboard" />)
    expect(container.querySelector('mark')).toHaveTextContent('Onboard')
  })

  it('marks nothing for an empty or whitespace query', () => {
    const { container } = render(<Highlight text="Onboarding" query="   " />)
    expect(container.querySelector('mark')).toBeNull()
    expect(screen.getByText('Onboarding')).toBeInTheDocument()
  })

  it('respects caseSensitive', () => {
    const { container } = render(<Highlight text="Onboard, then onboard" query="onboard" caseSensitive />)
    expect(container.querySelectorAll('mark')).toHaveLength(1)
  })

  it('treats regex metacharacters as literal text', () => {
    const { container } = render(<Highlight text="cost is 5 (five) dollars" query="(five)" />)
    expect(container.querySelectorAll('mark')).toHaveLength(1)
    expect(container.querySelector('mark')).toHaveTextContent('(five)')
  })

  it('renders the whole text when nothing matches', () => {
    const { container } = render(<Highlight text="Onboarding" query="zzz" />)
    expect(container.querySelector('mark')).toBeNull()
    expect(container.textContent).toBe('Onboarding')
  })
})
