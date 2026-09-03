import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ConditionalReveal } from './ConditionalReveal'

/* A field that only exists once an earlier answer makes it exist. It is four
 * lines, and the four lines are the whole decision: hidden means ABSENT, not
 * invisible — a field kept in the DOM behind display:none is still in the tab
 * order for a keyboard and still read out, which is how a form asks a question
 * it decided not to ask. */

describe('ConditionalReveal', () => {
  it('renders nothing at all while the condition is unmet', () => {
    const { container } = render(
      <ConditionalReveal when={false}><input aria-label="Other reason" /></ConditionalReveal>,
    )
    expect(container).toBeEmptyDOMElement()
    expect(screen.queryByLabelText('Other reason')).not.toBeInTheDocument()
  })

  it('reveals its children once the condition holds', () => {
    render(<ConditionalReveal when><input aria-label="Other reason" /></ConditionalReveal>)
    expect(screen.getByLabelText('Other reason')).toBeInTheDocument()
  })
})
