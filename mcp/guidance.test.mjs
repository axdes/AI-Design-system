/* What is worth testing about guidance is not the wording, it is the discipline:
 * that it stays quiet when there is nothing situational to say, that it never
 * repeats itself, that it stops entirely at the ceiling, and that it can tell a
 * loop from progress. A bank that talks on every call is the front-loaded prompt
 * again, one layer down, and that failure is silent — everything still answers.
 *
 * Plain .mjs next to the module for the same reason as server.test.mjs: this
 * package compiles for the browser with `"types": []`. */
import { describe, it, expect } from 'vitest'
import { createGuidance, MAX_NUDGES, NUDGES } from './guidance.mjs'

const problems = (n) =>
  n === 0
    ? '✓ Screen.tsx: every component and prop is real, no inline styles, no raw values.'
    : `✗ ${n} problem(s) in Screen.tsx:\n\ncomponents-exist:\n  <DataTable> is not in the registry\n\nno-raw-values:\n  padding: 12px`

const INDEX = '12 of 131 entries. This is the whole system: a component that is not here does not exist.'
const EMPTY_INDEX = 'Nothing matches. Call design_system_index with no arguments for the whole list of 131.'

describe('decision-time guidance', () => {
  it('says the index-to-component line once and then never again', () => {
    const g = createGuidance()
    expect(g.note('design_system_index', INDEX)).toMatch(/names, not contracts/)
    expect(g.note('design_system_index', INDEX)).toBeNull()
    expect(g.note('design_system_index', INDEX)).toBeNull()
  })

  it('is silent on a clean verify', () => {
    const g = createGuidance()
    expect(g.note('verify', problems(0))).toBeNull()
  })

  it('answers an empty index with the two real moves, not with silence', () => {
    const g = createGuidance()
    const note = g.note('design_system_index', EMPTY_INDEX)
    expect(note).toMatch(/Do not build the missing one/)
    expect(note).toMatch(/requests\//)
  })

  it('escalates to the contract when verify stops making progress', () => {
    const g = createGuidance()
    expect(g.note('verify', problems(5))).toMatch(/call `verify` again/)
    expect(g.note('verify', problems(5))).toBeNull()
    const stuck = g.note('verify', problems(5))
    expect(stuck).toMatch(/has not fallen/)
    /* It names what is failing, so the escalation is actionable rather than a
       complaint: the dimension headers come out of the answer itself. */
    expect(stuck).toMatch(/components-exist, no-raw-values/)
  })

  it('does not call it a loop while the count is falling', () => {
    const g = createGuidance()
    g.note('verify', problems(9))
    for (const n of [7, 5, 3, 1]) expect(g.note('verify', problems(n))).toBeNull()
  })

  it('never spends more than the measured ceiling on one session', () => {
    const g = createGuidance()
    const said = [
      g.note('design_system_index', INDEX),
      g.note('decide', 'Table. 6 comparable fields …'),
      g.note('component', 'Button — props …'),
      g.note('verify', problems(3)),
      g.note('verify', problems(3)),
      g.note('verify', problems(3)),
      g.note('design_system_index', EMPTY_INDEX),
    ].filter(Boolean)
    expect(said.length).toBe(MAX_NUDGES)
  })

  it('appends at most one line to any single answer', () => {
    const g = createGuidance()
    const note = g.note('verify', problems(4))
    expect(note.split('\n')).toHaveLength(1)
  })

  it('every nudge in the bank has an id, a trigger and words', () => {
    const ids = NUDGES.map((n) => n.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const n of NUDGES) {
      expect(typeof n.when).toBe('function')
      expect(typeof n.say).toBe('function')
    }
  })
})
