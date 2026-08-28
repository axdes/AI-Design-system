/* What the DTCG export carries out of the CSS besides the values.
 *
 * The values were always proven — every declaration is counted, every alias
 * resolves, and the whole file renders back to CSS value for value. The reasoning
 * was not. It is written in the CSS as comments, and the export took only the
 * comment that trails a declaration on its own line, so everything written ABOVE
 * a declaration was dropped: 22 of semantic.css's declarations carry a trailing
 * comment and 36 more carry only a preceding block.
 *
 * What went missing is not decoration. `$description` is the field an agent reads
 * to choose between two tokens that look alike, and the contrast argument behind
 * --muted-foreground is exactly that argument. The export was DTCG-shaped and
 * illegible, which is the harder failure to notice: every automated check passed. */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

const tokens = JSON.parse(readFileSync('tokens/design.tokens.json', 'utf8'))

const walk = (node, path = '') => {
  if (!node || typeof node !== 'object') return []
  if ('$value' in node) return [[path, node]]
  return Object.entries(node)
    .filter(([key]) => !key.startsWith('$'))
    .flatMap(([key, child]) => walk(child, path ? `${path}.${key}` : key))
}
const all = walk(tokens)
const described = all.filter(([, token]) => token.$description)

describe('the reasoning reaches the export', () => {
  it('takes the block comment written above a declaration', () => {
    /* Why --muted-foreground is neutral-700 and not -600 is a contrast
     * measurement, written above the line because it does not fit at the end of
     * it. An agent picking a secondary text colour has no way to reach it
     * otherwise, and picking -600 there misses AA. */
    expect(tokens.semantic['muted-foreground'].$description).toMatch(/4\.15:1/)
    expect(tokens.semantic['primary-active'].$description).toMatch(/^Pressed\./)
  })

  it('still prefers the comment that trails the declaration', () => {
    /* Where both exist the trailing one is about this token and the block above
     * is about the group. Adding the second source must not displace the first. */
    expect(tokens.semantic.muted.$description).toBe('page surface — body bg (gray-100)')
    expect(tokens.semantic.background.$description).toBe('white body')
  })

  it('does not attach a comment that a selector or a brace separates', () => {
    /* The file header sits above `:root {`, not above a declaration, so nothing
     * but whitespace is allowed between a comment and the token it describes.
     * Without that rule every file's preamble lands on its first token. */
    const header = /SEMANTIC — role tokens|Light = values mirror the reference prototype/
    const leaked = described.filter(([, token]) => header.test(token.$description))
    expect(leaked.map(([path]) => path)).toEqual([])
  })

  it('describes the layer components consume, not only the primitives', () => {
    /* The count is a floor, not the number of the day: it moves whenever someone
     * writes down a reason, which is the direction it should move. It was 8 of 83
     * when only trailing comments were read. */
    const semantic = all.filter(([path]) => path.startsWith('semantic.'))
    const withReason = semantic.filter(([, token]) => token.$description)
    expect(semantic.length).toBeGreaterThan(60)
    expect(withReason.length).toBeGreaterThanOrEqual(35)
  })
})
