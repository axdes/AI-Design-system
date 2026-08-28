/* The token layer resolved to numbers, held to the cases that made it exist.
 *
 * Every one of these is a value the registry publishes as an EXPRESSION and a
 * check needs as a number. When one of them stops resolving, a report about
 * somebody else's document quietly starts saying a real step is off the scale. */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { tokenValues, nearestLength, nearestColour, parseColour, colourDistance, toHex } from './lib/token-values.mjs'

const registry = JSON.parse(readFileSync('component-registry.json', 'utf8'))
const values = tokenValues(registry.tokens)
const byName = (name) => values.lengths.find((l) => l.name === name)

describe('resolving the layer', () => {
  it('resolves a var() chain through calc() to px', () => {
    /* --space-6 is calc(var(--grid-unit) * 6) and --grid-unit is 4px. Nothing
     * in the published value says 24, which is the whole problem. */
    expect(byName('--space-6')?.px).toBe(24)
    expect(byName('--space-1')?.px).toBe(4)
    expect(byName('--space-16')?.px).toBe(64)
  })

  it('resolves rem against the browser root, not against a token', () => {
    expect(byName('--font-base')?.px).toBe(15)
    expect(byName('--font-xl')?.px).toBe(24)
  })

  it('resolves min() and max(), because a real step hides inside one', () => {
    /* --radius-sm is max(0px, calc(--radius - --grid-unit)). Refusing the
     * function drops 4px off the radius scale, and then 4px reads as illegal. */
    expect(byName('--radius-sm')?.px).toBe(4)
  })

  it('refuses what has no single value rather than inventing one', () => {
    /* --space-section is clamp(..., 5vw, ...): it has no px value at all. */
    expect(byName('--space-section')).toBeUndefined()
  })

  it('resolves a semantic colour to the primitive hex behind it', () => {
    const background = values.colours.find((c) => c.name === '--background')
    expect(background?.hex).toMatch(/^#[0-9a-f]{6}$/)
    expect(values.colours.find((c) => c.name === '--brand-400')?.hex).toBe('#4638d3')
  })

  it('publishes the font stacks as families rather than as one string', () => {
    const body = values.fonts.find((f) => f.name === '--font-family')
    expect(body?.families[0]).toBe('Onest')
  })
})

describe('where a length sits', () => {
  it('finds the step when the number IS one', () => {
    expect(nearestLength(20, values.lengths, { group: 'spacing' }).exact?.name).toBe('--space-5')
  })

  it('names the steps either side when it is not', () => {
    const hit = nearestLength(18, values.lengths, { group: 'spacing' })
    expect(hit.exact).toBeNull()
    expect(hit.below?.px).toBe(16)
    expect(hit.above?.px).toBe(20)
  })

  it('answers with the scale, not with the plumbing', () => {
    /* Several semantic aliases resolve to 8px. Offering --popover-item-radius as
     * the answer to "what should 10px be" describes how the layer is wired
     * instead of answering the question. */
    expect(nearestLength(10, values.lengths, { group: 'radius' }).below?.name).toBe('--radius-md')
  })
})

describe('where a colour sits', () => {
  it('recognises a value the layer already has', () => {
    const hit = nearestColour(parseColour('#4638D3'), values.colours)
    expect(hit.exact?.name).toBe('--brand-400')
    expect(hit.same).toBe(true)
  })

  it('calls a shade off the brand the same colour, so a palette does not grow a twin', () => {
    expect(nearestColour(parseColour('#4739d4'), values.colours).same).toBe(true)
  })

  it('calls a genuinely different colour different, so a brand is not swallowed', () => {
    /* The case this threshold exists for: a client red that is nothing like any
     * red in the layer must reach the brand manifest, not be rounded into one. */
    const hit = nearestColour(parseColour('#E4002B'), values.colours)
    expect(hit.same).toBe(false)
    expect(hit.exact).toBeNull()
  })

  it('reads the three ways a document writes a colour', () => {
    expect(parseColour('#fff')).toEqual({ r: 255, g: 255, b: 255 })
    expect(parseColour('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 })
    expect(parseColour('rgb(255, 255, 255)')).toEqual({ r: 255, g: 255, b: 255 })
    expect(parseColour('not a colour')).toBeNull()
    expect(parseColour('rgb(999, 0, 0)')).toBeNull()
  })

  it('measures distance symmetrically and at zero for a match', () => {
    const a = parseColour('#123456'), b = parseColour('#654321')
    expect(colourDistance(a, a)).toBe(0)
    expect(colourDistance(a, b)).toBeCloseTo(colourDistance(b, a))
    expect(toHex(a)).toBe('#123456')
  })
})
