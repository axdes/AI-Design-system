import { describe, expect, it } from 'vitest'
import { makeFormEngine, type FormRulesDoc, type Spec, type Zone } from '../../scripts/lib/spec-rules.mjs'
import formJson from '../../screen-specs/form-rules.json'
import { REGISTRY_NAMES } from './harness/registryNames'

/* The form layer measures specs; this file measures the layer. The gate proves
 * every real spec passes it, which an engine that checks nothing would also do
 * — so here is the other half: every check goes red on a minimal case, and the
 * rules file is held to naming only things that exist. Same reasoning as
 * card-rules.test.ts: a rule that cannot fail is a comment. */

const formDoc = formJson as unknown as FormRulesDoc
const forms = makeFormEngine(formDoc)


const zone = (over: Partial<Zone> = {}): Zone => ({
  name: 'form',
  task: 'input',
  form: 'dialog',
  components: ['Modal', 'Field'],
  data: { fields: 3, commit: 'explicit', context: 'over-list' },
  ...over,
})
const spec: Spec = { template: 'ListPageTemplate' }

describe('form rules file', () => {
  it('builds every kind that is not planned from components the registry has', () => {
    for (const [id, kind] of Object.entries(formDoc.formKinds)) {
      if (kind.status === 'planned') continue
      for (const c of [...(kind.components?.required ?? []), ...(kind.components?.oneOf ?? []), ...(kind.templates ?? [])]) {
        expect(REGISTRY_NAMES, `${id} names ${c}`).toContain(c)
      }
    }
  })

  it('chooses and forbids only kinds that exist, and gives every kind a rule', () => {
    const ids = new Set(Object.keys(formDoc.formKinds))
    const chosen = new Set<string>()
    for (const r of formDoc.rules) {
      for (const c of r.choose) {
        expect(ids, `${r.id} chooses "${c}"`).toContain(c)
        chosen.add(c)
      }
    }
    for (const h of formDoc.hard ?? []) {
      for (const f of h.forbid) expect(ids, `${h.id} forbids "${f}"`).toContain(f)
      expect(ids, `${h.id} sends the author to "${h.instead}"`).toContain(h.instead)
    }
    for (const id of ids) expect(chosen, `no rule ever chooses "${id}"`).toContain(id)
  })

  it('gives every kind a commit model that exists', () => {
    const models = new Set(Object.keys(formDoc.commitModels))
    for (const [id, kind] of Object.entries(formDoc.formKinds)) {
      expect(kind.commit.length, `${id} commits nothing`).toBeGreaterThan(0)
      for (const c of kind.commit) expect(models, `${id} commits "${c}"`).toContain(c)
    }
  })
})

describe('the form engine can fail', () => {
  it('demands a kind and a commit model from an input zone', () => {
    const { problems } = forms.checkFormZone({ name: 'form', task: 'input', components: ['Field', 'Input'] }, spec)
    expect(problems.join('\n')).toMatch(/must name its form kind/)
    expect(problems.join('\n')).toMatch(/must say how it commits/)
  })

  it('rules out a dialog once the form is long (HF1)', () => {
    const { problems } = forms.checkFormZone(zone({ data: { fields: 12, commit: 'explicit', context: 'over-list' } }), spec)
    expect(problems.join('\n')).toMatch(/"dialog" is ruled out here/)
    expect(problems.join('\n')).toMatch(/scroll the actions out of the viewport/)
  })

  it('rules out autosave in a container with a Cancel button (HF2)', () => {
    const { problems } = forms.checkFormZone(zone({ data: { fields: 4, commit: 'autosave', context: 'over-list' } }), spec)
    expect(problems.join('\n')).toMatch(/"dialog" is ruled out here/)
    expect(problems.join('\n')).toMatch(/autosave has already committed it/)
  })

  it('rejects a kind no matching rule chooses for this shape', () => {
    const { problems } = forms.checkFormZone(
      zone({ form: 'settings', components: ['SettingsPageTemplate'], data: { fields: 3, commit: 'explicit', context: 'standalone' } }),
      spec,
    )
    expect(problems.join('\n')).toMatch(/"settings" is not what any matching rule chooses/)
  })

  it('rejects a commit model the kind does not have', () => {
    const { problems } = forms.checkFormZone(
      zone({ form: 'filter', components: ['FilterBar'], data: { fields: 2, commit: 'explicit', context: 'standalone' } }),
      spec,
    )
    expect(problems.join('\n')).toMatch(/"filter" commits none, not explicit/)
  })

  /* The engine's own doc, not the shipped one. This used to point at `inline`,
     which was `planned` — and when that kind was actually built (2026-08-26)
     the test went red for the best possible reason. A check on the ENGINE must
     not depend on the data happening to contain an example of what it checks. */
  it('rejects a kind that is agreed but not built yet', () => {
    const planned = makeFormEngine({
      ...formDoc,
      formKinds: { ...formDoc.formKinds, dialog: { ...formDoc.formKinds.dialog, status: 'planned' } },
    } as FormRulesDoc)
    const { problems } = planned.checkFormZone(
      zone({ form: 'dialog', components: ['Modal'], data: { fields: 2, commit: 'explicit', context: 'over-list' } }),
      spec,
    )
    expect(problems.join('\n')).toMatch(/is planned, not built/)
  })

  it('holds a kind to the parts it is built from', () => {
    const { problems } = forms.checkFormZone(zone({ components: ['Field', 'Input'] }), spec)
    expect(problems.join('\n')).toMatch(/is built from Modal; the zone never names Modal/)
  })

  it('rejects a form kind on a zone that does not take input', () => {
    const { problems } = forms.checkFormZone(zone({ task: 'read' }), spec)
    expect(problems.join('\n')).toMatch(/a form kind belongs to a zone whose task is input/)
  })

  it('rejects vocabulary it does not have', () => {
    const bad = forms.checkFormZone(zone({ data: { fields: 3, commit: 'later' as never, context: 'over-list' } }), spec)
    expect(bad.problems.join('\n')).toMatch(/data.commit "later"/)
  })
})

describe('the form engine says what it expects', () => {
  it('asks a four-field explicit form for an error summary (NF-summary)', () => {
    const { notes } = forms.checkFormZone(zone({ data: { fields: 5, commit: 'explicit', context: 'over-list' } }), spec)
    expect(notes.join('\n')).toMatch(/ErrorSummary/)
  })

  it('asks an autosaving page for a save status, and stops asking once it has one (NF-draft-status)', () => {
    const shape = { fields: 9, commit: 'autosave', context: 'standalone', familiarity: 'routine' } as const
    const without = forms.checkFormZone(
      zone({ form: 'page', components: ['FormPageTemplate', 'FormSection'], data: { ...shape } }),
      spec,
    )
    expect(without.notes.join('\n')).toMatch(/SaveStatus/)

    const with_ = forms.checkFormZone(
      zone({ form: 'draft', components: ['FormPageTemplate', 'SaveStatus', 'FormSection'], data: { ...shape } }),
      spec,
    )
    expect(with_.notes.join('\n')).not.toMatch(/SaveStatus/)
  })

  it('counts the screen template as a named part', () => {
    const { problems } = forms.checkFormZone(
      { name: 'form', task: 'input', form: 'auth', components: ['Field', 'Input'], data: { fields: 2, commit: 'explicit', context: 'standalone' } },
      { template: 'AuthTemplate' },
    )
    expect(problems).toEqual([])
  })

  it('sees a zone built from form parts that never says so', () => {
    const { unchecked } = forms.checkFormZone({ name: 'panel', components: ['FormStack', 'Field'] }, spec)
    expect(unchecked).toBe(true)
  })
})

describe('the verdict an agent can ask for before writing', () => {
  it('sends a long unfamiliar form to a wizard, not a dialog', () => {
    const { permitted } = forms.chooseKind({ fields: 14, commit: 'explicit', familiarity: 'unfamiliar', context: 'standalone' })
    expect(permitted).toContain('wizard')
    expect(permitted).not.toContain('dialog')
  })

  it('sends a long routine form to a page, not a wizard', () => {
    const { permitted } = forms.chooseKind({ fields: 14, commit: 'explicit', familiarity: 'routine', context: 'standalone' })
    expect(permitted).toContain('page')
    expect(permitted).not.toContain('wizard')
  })

  it('sends a per-row commit to settings, never to a page with its own Save', () => {
    const { permitted } = forms.chooseKind({ fields: 9, commit: 'per-row', context: 'standalone' })
    expect(permitted).toContain('settings')
    /* A grid survives: editing cell by cell IS a per-row commit. A page form
     * does not, and that is the mix Pajamas warns about. */
    expect(permitted).not.toContain('page')
    expect(permitted).not.toContain('draft')
    expect(permitted).not.toContain('dialog')
  })
})
