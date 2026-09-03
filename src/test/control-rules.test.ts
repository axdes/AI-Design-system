import { describe, expect, it } from 'vitest'
import { makeControlEngine, OPTION_RANGE, type ControlDecl, type ControlRulesDoc, type ControlZone } from '../../scripts/lib/control-rules.mjs'
import controlJson from '../../screen-specs/control-rules.json'
import { REGISTRY_NAMES } from './harness/registryNames'

/* The layer under "forms" measures specs; this file measures the layer.
 *
 * The gate proves every real spec passes it, which an engine that checks nothing
 * would also do — so here is the other half: each check goes red on a minimal
 * case, and the rules file itself is held to naming only components that exist.
 * Same arrangement as card-rules.test.ts, for the same reason.
 */

const doc = controlJson as unknown as ControlRulesDoc
const controls = makeControlEngine(doc)

const kinds = doc.controlKinds

/** The smallest zone the engine will look at: a form zone with one control.
 *  Deliberately loose about the control's shape — half these cases are the
 *  wrong shape on purpose, which is what the engine is being asked about. */
const zone = (control: Record<string, unknown>, components: string[]): ControlZone => ({
  name: 'the form',
  task: 'input',
  components,
  controls: [{ name: 'a field', ...control } as ControlDecl],
})

describe('control rules file', () => {
  it('builds every kind that is not planned from components the registry has', () => {
    for (const [id, kind] of Object.entries(kinds)) {
      if (kind.status === 'planned') continue
      for (const c of [...(kind.components.required ?? []), ...(kind.components.expect ?? [])]) {
        expect(REGISTRY_NAMES, `${id} names ${c}`).toContain(c)
      }
    }
  })

  it('says what every kind is for, when it is the wrong answer, and what it owes', () => {
    for (const [id, kind] of Object.entries(kinds)) {
      expect(kind.means, `${id}.means`).toBeTruthy()
      expect(kind.useWhen, `${id}.useWhen`).toBeTruthy()
      expect(kind.notWhen, `${id}.notWhen`).toBeTruthy()
      expect(kind.owes.length, `${id}.owes`).toBeGreaterThan(0)
    }
  })

  /* The ranges BOUND rather than pick, and they overlap where the screen gets to
     decide — but every count must still have somewhere to go, or the rule is a
     dead end rather than a decision. */
  it('leaves no option count without a choice kind that carries it', () => {
    for (let n = 2; n <= 60; n++) {
      const matches = Object.entries(OPTION_RANGE).filter(([, [lo, hi]]) => n >= lo && n <= hi)
      expect(matches.length, `${n} options`).toBeGreaterThan(0)
    }
  })
})

describe('control engine', () => {
  it('passes the shape it is meant to pass', () => {
    const r = controls.checkControls(zone({ takes: 'text' }, ['Input', 'Field']))
    expect(r.problems).toEqual([])
  })

  it('says nothing about a zone that declares no controls', () => {
    const r = controls.checkControls({ name: 'the form', task: 'input', components: [] })
    expect(r.problems).toEqual([])
    expect(r.notes).toEqual([])
  })

  it('fails a kind that does not exist', () => {
    const r = controls.checkControls(zone({ takes: 'colour-wheel' }, ['Input', 'Field']))
    expect(r.problems.join(' ')).toContain('not a control kind')
  })

  it('fails a control whose component the zone never names', () => {
    const r = controls.checkControls(zone({ takes: 'date' }, ['Field']))
    expect(r.problems.join(' ')).toContain('<DatePicker>')
  })

  /* V1 — the label, the description and the error are one part. */
  it('fails a value-carrying control outside a Field, and lets the three exceptions through', () => {
    expect(controls.checkControls(zone({ takes: 'text' }, ['Input'])).problems.join(' ')).toContain('V1')
    for (const takes of ['query', 'message', 'toggle'] as const) {
      const parts = { query: ['SearchInput'], message: ['ChatComposer'], toggle: ['Switch'] }[takes]
      const extra = takes === 'toggle' ? { applies: 'at-once' } : {}
      expect(controls.checkControls(zone({ takes, ...extra }, parts)).problems, takes).toEqual([])
    }
  })

  /* V2 — the option count is what chooses between the three. */
  it('makes a choice say how many options it has', () => {
    const r = controls.checkControls(zone({ takes: 'choice' }, ['Radio', 'Field']))
    expect(r.problems.join(' ')).toContain('how many options')
  })

  it('refuses a set too big to scan laid out, and one too big to scroll in a menu', () => {
    const nine = controls.checkControls(zone({ takes: 'choice', options: 9 }, ['Radio', 'Field']))
    expect(nine.problems.join(' ')).toContain('use choice-long')
    const forty = controls.checkControls(zone({ takes: 'choice-long', options: 40 }, ['Select', 'Field']))
    expect(forty.problems.join(' ')).toContain('use choice-searched')
  })

  /* Between two and five the screen decides: comparing a plan is not looking up
     an area, and the count alone cannot tell them apart. */
  it('lets a small set be either laid out or listed', () => {
    expect(controls.checkControls(zone({ takes: 'choice', options: 5 }, ['Radio', 'Field'])).problems).toEqual([])
    expect(controls.checkControls(zone({ takes: 'choice-long', options: 2 }, ['Select', 'Field'])).problems).toEqual([])
  })

  it('rejects an option count on something with no options', () => {
    const r = controls.checkControls(zone({ takes: 'text', options: 4 }, ['Input', 'Field']))
    expect(r.problems.join(' ')).toContain('drop `options`')
  })

  /* V3 — a switch applies, a checkbox submits, and the screen knows which. */
  it('makes an on/off control say when it applies, and holds it to the answer', () => {
    expect(controls.checkControls(zone({ takes: 'toggle' }, ['Switch'])).problems.join(' '))
      .toContain('does not say when it applies')
    const wrong = controls.checkControls(zone({ takes: 'toggle', applies: 'on-submit' }, ['Switch']))
    expect(wrong.problems.join(' ')).toContain('which is agreement')
    const right = controls.checkControls(zone({ takes: 'agreement', applies: 'on-submit' }, ['Checkbox', 'Field']))
    expect(right.problems).toEqual([])
  })

  /* V5 — a capped field says what is left. */
  it('makes a capped text field carry a CharacterCount', () => {
    const bare = controls.checkControls(zone({ takes: 'long-text', cap: 140 }, ['Textarea', 'Field']))
    expect(bare.problems.join(' ')).toContain('V5')
    const counted = controls.checkControls(zone({ takes: 'long-text', cap: 140 }, ['Textarea', 'Field', 'CharacterCount']))
    expect(counted.problems).toEqual([])
  })

  it('rejects a cap on something that is not typed text', () => {
    const r = controls.checkControls(zone({ takes: 'date', cap: 10 }, ['DatePicker', 'Field']))
    expect(r.problems.join(' ')).toContain('drop `cap`')
  })

  /* VN-required — a note, not a failure: marking the majority is noise. */
  it('notes a form that marks most of its fields required', () => {
    const r = controls.checkControls({
      name: 'the form',
      task: 'input',
      components: ['Input', 'Field'],
      controls: [1, 2, 3, 4].map((i) => ({ name: `field ${i}`, takes: 'text', required: true })) as ControlDecl[],
    })
    expect(r.problems).toEqual([])
    expect(r.notes.join(' ')).toContain('mark the OPTIONAL ones')
  })
})
