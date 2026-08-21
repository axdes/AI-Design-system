import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { a11yViolations } from './a11y'
import registry from '../../component-registry.json'

/* Every golden example is executed here. This is the point of authoring them as
 * modules instead of snippets: the usage we publish to agents in
 * component-registry.json is proven to compile (tsc), to render, and to be
 * accessible (axe) — so a prop rename or a lost aria-label cannot ship while the
 * docs still claim otherwise. */
const modules = import.meta.glob<{ Example?: () => ReactElement }>('../**/*.example.tsx', {
  eager: true,
})

const cases = Object.entries(modules).map(([path, mod]) => ({
  name: path.split('/').pop()!.replace('.example.tsx', ''),
  Example: mod.Example,
}))

const entries = { ...registry.components, ...registry.blocks } as Record<
  string,
  { ref: string; status?: string; example?: string }
>

describe('golden examples', () => {
  it('every canonical component and block has one', () => {
    const missing = Object.values(entries)
      .filter((e) => e.status !== 'deprecated' && !e.example)
      .map((e) => e.ref)
    expect(missing).toEqual([])
  })

  it('no example file belongs to a component that no longer exists', () => {
    const orphans = cases.map((c) => c.name).filter((name) => !entries[name])
    expect(orphans).toEqual([])
  })

  it.each(cases)('$name exports Example()', ({ Example }) => {
    expect(typeof Example).toBe('function')
  })

  it.each(cases)('$name renders', ({ Example }) => {
    const Component = Example!
    const { baseElement } = render(<Component />)
    expect(baseElement.querySelectorAll('*').length).toBeGreaterThan(1)
  })

  it.each(cases)('$name has no axe violations', async ({ Example }) => {
    const Component = Example!
    const { baseElement } = render(<Component />)
    expect(await a11yViolations(baseElement)).toEqual([])
  })
})
