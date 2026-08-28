import { describe, expect, it } from 'vitest'
import { makeLifecycleEngine, type LifecycleDoc, type RulesDoc } from '../../scripts/lib/spec-rules.mjs'
import lifeJson from '../../screen-specs/lifecycle-rules.json'
import rulesJson from '../../screen-specs/selection-rules.json'
import { REGISTRY_NAMES } from './harness/registryNames'

/* The gate proves every real spec passes this layer, which an engine that
 * decided nothing would also do. This file is the other half: each decision is
 * made on a minimal case and has to come out the way the rule says, and the
 * rules file is held to naming only things that exist. */

const doc = lifeJson as unknown as LifecycleDoc
const rules = rulesJson as unknown as RulesDoc
const life = makeLifecycleEngine(doc)

describe('lifecycle rules file', () => {
  it('names only components the registry has, unless the kind is planned', () => {
    const missing: string[] = []
    for (const group of [doc.detailVariants, doc.editKinds, doc.deleteKinds]) {
      for (const [id, kind] of Object.entries(group)) {
        if (kind.status === 'planned') continue
        for (const c of [...(kind.components?.required ?? []), ...(kind.components?.oneOf ?? [])]) {
          if (!REGISTRY_NAMES.has(c)) missing.push(`${id} -> ${c}`)
        }
      }
    }
    expect(missing).toEqual([])
  })

  it('covers every archetype the shape layer knows, and invents none', () => {
    expect(Object.keys(doc.archetypeStages).sort()).toEqual(Object.keys(rules.archetypes ?? {}).sort())
  })

  it('gives every planned kind the condition that opens it', () => {
    const silent = [doc.detailVariants, doc.editKinds, doc.deleteKinds]
      .flatMap((g) => Object.entries(g))
      .filter(([, k]) => k.status === 'planned' && !k.opensWhen)
      .map(([id]) => id)
    expect(silent).toEqual([])
  })
})

describe('deleting', () => {
  it('gives reversible destruction an undo and no dialog', () => {
    /* A confirmation over something reversible is what trains a reader to click
       through confirmations, which is how the unreversible one gets clicked
       through too. */
    expect(life.chooseDelete({ reversible: true }).permitted).toEqual(['undo'])
  })

  it('gives one irreversible record a yes/no', () => {
    expect(life.chooseDelete({ reversible: false, blastRadius: 'one' }).permitted).toEqual(['confirm'])
  })

  it('asks for the name typed when the destruction reaches other people', () => {
    const v = life.chooseDelete({ reversible: false, blastRadius: 'many' })
    expect(v.permitted).toContain('confirm-typed')
    /* Buildable since 2026-08-26. It was `planned` because no dialog both took
       input and coloured its commitment — one took input, the other coloured.
       Folding FormModal and ConfirmDialog into Modal made one dialog that does
       both: `children` for the typed name, `actions.tone` for the button. */
    expect(doc.deleteKinds['confirm-typed'].status).toBe('built')
  })

  it('refuses an undo for something that cannot be undone', () => {
    const v = life.chooseDelete({ reversible: false, blastRadius: 'one' })
    expect(v.forbidden.map((h) => h.id)).toContain('XH1')
    expect(v.permitted).not.toContain('undo')
  })
})

describe('editing and the detail page', () => {
  it('does not make a form out of one value changed in place', () => {
    expect(life.chooseEdit({ fields: 1, context: 'in-place' }).permitted).toEqual(['attribute'])
  })

  it('sends editing across rows to the grid', () => {
    expect(life.chooseEdit({ scope: 'collection' }).permitted).toEqual(['inline'])
  })

  it('keeps a short record stacked and lets a long one earn tabs', () => {
    expect(life.chooseDetail({ sections: 3 }).permitted).toEqual(['plain'])
    expect(life.chooseDetail({ sections: 7 }).permitted).toContain('tabs')
  })

  it('makes a record whose actions all live elsewhere a hub', () => {
    expect(life.chooseDetail({ acts: 'elsewhere' }).permitted).toContain('hub')
  })
})

describe('a screen may not claim a stage its archetype does not serve', () => {
  it('accepts a detail page that reads and updates', () => {
    expect(life.checkLifecycle({ archetype: 'detail', lifecycle: ['read', 'update'] }).problems).toEqual([])
  })

  it('rejects an overview that claims to delete', () => {
    const { problems } = life.checkLifecycle({ archetype: 'overview', lifecycle: 'delete' })
    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain('serves read')
  })

  it('rejects a stage that does not exist', () => {
    expect(life.checkLifecycle({ archetype: 'list', lifecycle: 'archive' }).problems[0]).toContain('use create | read | update | delete')
  })
})
