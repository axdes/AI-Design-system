import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Code } from './Code'

/* Code, in a sentence or in a block. The block is the interesting one: it
 * scrolls, and anything that scrolls has to be reachable by a keyboard or its
 * content is unreadable without a mouse (SC 2.1.1). */

describe('Code', () => {
  it('is a plain code element inside a sentence', () => {
    const { container } = render(<Code inline>npm run check</Code>)
    expect(container.querySelector('code')).toHaveTextContent('npm run check')
    expect(container.querySelector('pre')).toBeNull()
  })

  it('is a keyboard-reachable region as a block, because it scrolls', () => {
    render(<Code label="Install the skill">npm run check</Code>)
    const region = screen.getByRole('region', { name: 'Install the skill' })
    expect(region.tagName).toBe('PRE')
    expect(region).toHaveAttribute('tabindex', '0')
  })
})
