import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import registry from '../../component-registry.json'
import { RENDER, NOT_RENDERABLE } from './render-map'

/* The registry is the contract agents build against: it promises that
 * `<Button variant="success">` exists AND that it lands as `data-variant="success"` in
 * DOM, which is what the CSS selects on. The generator checks the CSS side
 * statically; this checks the runtime side. A component that stops forwarding
 * its data-* attribute keeps compiling and silently loses all of its styling —
 * that is the regression these cases catch. The RENDER / NOT_RENDERABLE maps
 * live in ./render-map so the visual gallery's Variants mode reuses them. */

type Variant = { prop: string; values?: string[] }
type Entry = { ref: string; variants?: Record<string, Variant> }

const entries = { ...registry.components, ...registry.blocks } as unknown as Record<string, Entry>

const withValues = Object.values(entries).filter((e) =>
  Object.values(e.variants ?? {}).some((v) => (v.values ?? []).length > 0),
)

const cases = withValues
  .filter((e) => RENDER[e.ref])
  .flatMap((e) =>
    Object.entries(e.variants!).flatMap(([attr, v]) =>
      (v.values ?? []).map((value) => ({ ref: e.ref, attr, prop: v.prop, value })),
    ),
  )

describe('registry contract', () => {
  it('every component with declared variants is exercised', () => {
    const uncovered = withValues
      .map((e) => e.ref)
      .filter((ref) => !RENDER[ref] && !NOT_RENDERABLE[ref])
    expect(uncovered).toEqual([])
  })

  it.each(cases)('$ref: $prop="$value" renders data-$attr', ({ ref, attr, prop, value }) => {
    const propValue = value === 'true' ? true : value
    const { baseElement } = render(RENDER[ref]({ [prop]: propValue }))
    const selector = value === 'true' ? `[data-${attr}]` : `[data-${attr}="${value}"]`
    expect(baseElement.querySelector(selector), `${ref} did not render ${selector}`).not.toBeNull()
  })
})
