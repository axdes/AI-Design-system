import { describe, expect, it } from 'vitest'
import {
  makeRuleEngine,
  checkPrimaryActions,
  checkPriority,
  checkContentModel,
  type RulesDoc,
  type Spec,
} from '../../scripts/lib/spec-rules.mjs'
import rulesJson from '../../screen-specs/selection-rules.json'
import wrongJson from '../../screen-specs/fixtures/wrong-representation.json'
import wrongModelJson from '../../screen-specs/fixtures/wrong-model.json'
import registry from '../../component-registry.json'

/* The decision layer measures specs; these tests measure the decision layer.
 * The gate proves the ten real specs PASS the rules — that alone would also be
 * true of an engine that checks nothing, so this file holds the other half:
 * every check can go red, on the planted-defect fixture and on minimal cases.
 * Same reasoning as evals.test.ts: a scorer that cannot fail is a hole. */

const rules = rulesJson as unknown as RulesDoc
const wrong = wrongJson as unknown as Spec
const engine = makeRuleEngine(rules)

describe('selection rules file', () => {
  it('builds representations only from components the registry has', () => {
    const known = new Set([
      ...Object.keys(registry.components),
      ...Object.keys(registry.blocks),
    ])
    for (const name of engine.representationComponents) expect(known, name).toContain(name)
  })

  it('covers every collection task with at least one rule', () => {
    for (const task of rules.collectionTasks) {
      const covered = rules.rules.some((r) => {
        const t = (r.when as { task?: string[] }).task
        return !t || t.includes(task)
      })
      expect(covered, `no rule ever matches task=${task}`).toBe(true)
    }
  })

  it('chooses and forbids only representations that exist', () => {
    const reps = new Set(Object.keys(rules.representations))
    for (const r of rules.rules) for (const c of r.choose) expect(reps, `${r.id} chooses "${c}"`).toContain(c)
    for (const h of rules.hard ?? []) for (const f of h.forbid) expect(reps, `${h.id} forbids "${f}"`).toContain(f)
  })
})

describe('the engine can fail', () => {
  it('rejects cards where the task is comparing records (R1)', () => {
    const zone = wrong.zones!.find((z) => z.name === 'content')!
    const { problems } = engine.checkZone(zone)
    expect(problems.join('\n')).toMatch(/"cards" is not what any matching rule chooses/)
    expect(problems.join('\n')).toMatch(/R1/)
  })

  it('rules out a Table over an unbounded set (H1)', () => {
    const zone = wrong.zones!.find((z) => z.name === 'history')!
    const { problems } = engine.checkZone(zone)
    expect(problems.join('\n')).toMatch(/"table" is ruled out/)
    expect(problems.join('\n')).toMatch(/DataGrid/)
  })

  it('demands the data shape as soon as a collection zone declares its task', () => {
    const { problems } = engine.checkZone({
      name: 'content',
      task: 'browse',
      components: ['Card', 'CardTitle'],
    })
    expect(problems.join('\n')).toMatch(/must say what the data looks like/)
  })

  it('flags a collection zone that names no task as invisible to the rules', () => {
    const { unchecked } = engine.checkZone({ name: 'content', components: ['Table'] })
    expect(unchecked).toBe(true)
  })

  it('a short queue may be cards, a long one may not (R10 vs R8)', () => {
    const zone = (cardinality: 'few' | 'many') => ({
      name: 'queue',
      task: 'process',
      data: { item: 'record' as const, cardinality, fields: 4 },
      components: ['Card', 'CardTitle', 'Badge', 'Button'],
    })
    expect(engine.checkZone(zone('few')).problems).toEqual([])
    expect(engine.checkZone(zone('many')).problems.join('\n')).toMatch(/R8/)
  })

  it('accepts what the rules choose: prose is cards, records in columns', () => {
    const prose = engine.checkZone({
      name: 'content',
      task: 'process',
      data: { item: 'prose', cardinality: 'many' },
      components: ['Card', 'SectionLabel'],
    })
    expect(prose.problems).toEqual([])
    const records = engine.checkZone({
      name: 'content',
      task: 'find',
      data: { item: 'record', cardinality: 'many', fields: 10 },
      components: ['Card', 'Table'],
    })
    expect(records.problems).toEqual([])
  })
})

describe('the content-model check can fail', () => {
  const wrongModel = wrongModelJson as Parameters<typeof checkContentModel>[0]
  const specsById = {
    tickets: {
      id: 'tickets',
      zones: [{ name: 'content', components: ['Table'] }],
      data: ['tickets: subject, severity — the third core attribute is deliberately absent'],
      behaviours: [{ id: 'closes-for-real' }],
    },
  }

  it('trips every planted defect in the wrong-model fixture', () => {
    const { problems, notes } = checkContentModel(wrongModel, specsById)
    const all = problems.join('\n')
    expect(all).toMatch(/relation points to "customer"/)
    expect(all).toMatch(/role "manager", which is not in roles/)
    expect(all).toMatch(/names screen "escalations", and no such spec exists/)
    expect(all).toMatch(/core attribute\(s\) assignee appear nowhere in "tickets"/)
    expect(all).toMatch(/litmus test/)
    expect(all).toMatch(/"tickets" has no behaviour "never-agreed"/)
    expect(notes.join('\n')).toMatch(/action "annotate" lands on no screen/)
    expect(notes.join('\n')).toMatch(/no screen carries this object/)
  })

  it('accepts an action proven by a behaviour that exists', () => {
    const model = {
      id: 'ok-app',
      title: 'ok',
      roles: ['operator'],
      objects: {
        ticket: {
          description: 'a ticket',
          attributes: { core: ['subject', 'severity'] },
          actions: [{ verb: 'close', roles: ['operator'], screen: 'tickets', provenBy: 'tickets#closes-for-real' }],
          screens: { collection: 'tickets' },
        },
      },
    }
    expect(checkContentModel(model, specsById).problems).toEqual([])
  })

  it('passes a model whose derivation holds, and reports what it claimed', () => {
    const model = {
      id: 'ok-app',
      title: 'ok',
      roles: ['operator'],
      objects: {
        ticket: {
          description: 'a ticket',
          attributes: { core: ['subject', 'severity'] },
          actions: [{ verb: 'close', roles: ['operator'], screen: 'tickets' }],
          screens: { collection: 'tickets' },
        },
      },
    }
    const { problems, claimed } = checkContentModel(model, specsById)
    expect(problems).toEqual([])
    expect([...claimed]).toContain('tickets')
  })
})

describe('priority and archetype checks can fail', () => {
  it('fails when the first answering zone does not answer the primaryQuestion', () => {
    const { problems } = checkPriority(wrong)
    expect(problems.join('\n')).toMatch(/not the primaryQuestion/)
  })

  it('fails two primary buttons in one zone, notes two on one surface', () => {
    const one = checkPrimaryActions([
      { name: 'header', components: ['Button variant=primary', 'Button variant=primary block'] },
    ])
    expect(one.problems.join('\n')).toMatch(/a screen answers once/)
    const samePage = checkPrimaryActions([
      { name: 'header', components: ['Button variant=primary'] },
      { name: 'notice', components: ['Button variant=primary'] },
    ])
    expect(samePage.problems).toEqual([])
    expect(samePage.notes.join('\n')).toMatch(/answers twice/)
  })

  it('keeps tab and dialog primaries out of the page count', () => {
    const apart = checkPrimaryActions([
      { name: 'header', components: ['Button variant=primary'] },
      { name: 'chats', surface: 'tab:chats', components: ['Button variant=primary'] },
      { name: 'outreach', surface: 'dialog', components: ['Button variant=primary'] },
      { name: 'dialogs', components: ['Button variant=primary'] },
    ])
    expect(apart.problems).toEqual([])
    expect(apart.notes).toEqual([])
  })

  it('rejects a surface outside the vocabulary, notes browse prose that talks of comparing', () => {
    const bad = engine.checkZone({ name: 'content', surface: 'popup', components: ['Card'] })
    expect(bad.problems.join('\n')).toMatch(/surface "popup"/)
    const dodge = engine.checkZone({
      name: 'content',
      task: 'browse',
      data: { item: 'record', cardinality: 'many', fields: 5 },
      purpose: 'Cards the user reads to compare teams against each other.',
      components: ['Card'],
    })
    expect(dodge.notes.join('\n')).toMatch(/task is compare/)
  })

  it('fails a worklist that still carries a FilterBar', () => {
    const { problems } = engine.checkArchetype(
      { archetype: 'worklist', template: 'ListPageTemplate' },
      new Set(['FilterBar', 'Table']),
    )
    expect(problems.join('\n')).toMatch(/worklist/)
  })

  it('fails an archetype on the wrong template', () => {
    const { problems } = engine.checkArchetype({ archetype: 'auth', template: 'ListPageTemplate' }, new Set())
    expect(problems.join('\n')).toMatch(/AuthTemplate/)
  })

  it('archetype templates and expectations name real things', () => {
    const known = new Set([
      ...Object.keys(registry.components),
      ...Object.keys(registry.blocks),
    ])
    for (const [name, a] of Object.entries(rules.archetypes ?? {})) {
      expect(a.useWhen, `${name} has no useWhen`).toBeTruthy()
      expect(a.notWhen, `${name} has no notWhen`).toBeTruthy()
      for (const t of a.templates) expect(known, `${name} template ${t}`).toContain(t)
      for (const c of [...(a.forbidComponents ?? []), ...(a.expectsOneOf ?? [])]) {
        expect(known, `${name} names ${c}`).toContain(c)
      }
    }
  })

  it('decides: compare over records is a table, and says why', () => {
    const d = engine.decide('compare', { item: 'record', cardinality: 'many', fields: 6 })
    expect(d.allowed).toContain('table')
    expect(d.allowed).not.toContain('cards')
    expect(d.matched.map((r) => r.id)).toContain('R1')
    expect(d.components.table).toContain('Table')
  })
})
