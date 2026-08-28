import { describe, expect, it } from 'vitest'
import { makeCardEngine, makeRuleEngine, type CardRulesDoc, type RulesDoc } from '../../scripts/lib/spec-rules.mjs'
import cardJson from '../../screen-specs/card-rules.json'
import rulesJson from '../../screen-specs/selection-rules.json'
import { REGISTRY_NAMES } from './harness/registryNames'

/* The layer under "cards" measures specs; this file measures the layer. The
 * gate proves every real spec passes it, which an engine that checks nothing
 * would also do — so here is the other half: each check goes red on a minimal
 * case, and the rules file itself is held to naming only things that exist. */

const cardDoc = cardJson as unknown as CardRulesDoc
const rules = rulesJson as unknown as RulesDoc
const cards = makeCardEngine(cardDoc, { collectionTasks: rules.collectionTasks })
const reps = makeRuleEngine(rules)

/* Parts count: CardTitle is an export of Card, not an entry of its own, and a
 * family is built from parts as much as from entries. */

describe('card rules file', () => {
  it('builds every family that is not planned from components the registry has', () => {
    for (const f of cardDoc.families) {
      if (f.status === 'planned') continue
      for (const c of [...(f.components.required ?? []), ...(f.components.oneOf ?? [])]) {
        expect(REGISTRY_NAMES, `${f.id} names ${c}`).toContain(c)
      }
    }
  })

  it('gives every family a content kind that exists, and every kind a family', () => {
    const kinds = new Set(Object.keys(cardDoc.contentKinds))
    const carried = new Set<string>()
    for (const f of cardDoc.families) {
      expect(f.carries.length, `${f.id} carries nothing`).toBeGreaterThan(0)
      for (const k of f.carries) {
        expect(kinds, `${f.id} carries ${k}`).toContain(k)
        carried.add(k)
      }
    }
    for (const k of kinds) expect(carried, `no family carries ${k}`).toContain(k)
  })

  it('chooses only families that exist, for content kinds that exist', () => {
    const ids = new Set(cardDoc.families.map((f) => f.id))
    for (const r of [...cardDoc.rules, ...(cardDoc.hard ?? [])]) {
      const choose = 'choose' in r ? r.choose : r.forbid
      for (const id of choose) expect(ids, `${r.id} names ${id}`).toContain(id)
      const carries = (r.when as { carries?: string }).carries
      if (carries) expect(Object.keys(cardDoc.contentKinds), `${r.id} carries ${carries}`).toContain(carries)
    }
  })

  it('says what every family is for and when it is the wrong answer', () => {
    for (const f of cardDoc.families) {
      expect(f.intent, `${f.id} has no intent`).toBeTruthy()
      expect(f.notWhen, `${f.id} never says when NOT to use it`).toBeTruthy()
      expect(f.anatomy.required.length, `${f.id} requires no parts`).toBeGreaterThan(0)
    }
  })
})

/* One zone, built to break one check each. `rep` is what the layer above
 * decided, so these are the cases that reach the card layer at all. */
const zone = (over: Record<string, unknown>) => ({
  name: 'content',
  task: 'browse',
  data: { item: 'record' as const, cardinality: 'few' as const, carries: 'entity' },
  components: ['Card', 'CardTitle'],
  ...over,
})

describe('card family engine', () => {
  it('passes the shape it is meant to pass', () => {
    const { problems } = cards.checkCardZone(zone({ card: 'object' }), 'cards')
    expect(problems).toEqual([])
  })

  it('fails a cards zone that never says what it carries', () => {
    const { problems } = cards.checkCardZone(zone({ card: 'object', data: { item: 'record', cardinality: 'few' } }), 'cards')
    expect(problems.join('\n')).toMatch(/must say what one card carries/)
  })

  it('fails a cards zone that names no family', () => {
    const { problems } = cards.checkCardZone(zone({}), 'cards')
    expect(problems.join('\n')).toMatch(/must name its card family/)
  })

  it('fails a family that does not exist', () => {
    const { problems } = cards.checkCardZone(zone({ card: 'sticker' }), 'cards')
    expect(problems.join('\n')).toMatch(/does not exist/)
  })

  it('fails a family that carries something else', () => {
    const { problems } = cards.checkCardZone(zone({ card: 'plan' }), 'cards')
    expect(problems.join('\n')).toMatch(/carries offer, not entity/)
  })

  it('fails a family the rules do not choose for this task and content', () => {
    const { problems } = cards.checkCardZone(
      zone({ card: 'story', data: { item: 'record', cardinality: 'few', carries: 'entity' } }),
      'cards',
    )
    expect(problems.join('\n')).toMatch(/is not what any matching rule chooses/)
  })

  it('rules out a link-away card for something waiting on the reader', () => {
    const { problems } = cards.checkCardZone(
      zone({ task: 'process', card: 'entry', data: { item: 'record', cardinality: 'few', carries: 'request' } }),
      'cards',
    )
    expect(problems.join('\n')).toMatch(/ruled out for request/)
  })

  it('fails a family whose components the zone never names', () => {
    const { problems } = cards.checkCardZone(zone({ card: 'object', components: ['Card'] }), 'cards')
    expect(problems.join('\n')).toMatch(/never names CardTitle/)
  })

  /* Every family in the real file is built or composed today, which is the
   * point of the layer — so the planned check is proved on a doc of its own.
   * A rule that only holds while nobody uses it is not a rule. */
  it('fails a family that is planned rather than built', () => {
    const planned = makeCardEngine(
      {
        contentKinds: { entity: { means: 'a record' } },
        families: [
          {
            id: 'sketch',
            name: 'Sketch card',
            carries: ['entity'],
            intent: 'a family nobody has built yet',
            anatomy: { required: ['title'] },
            components: { required: ['Card'] },
            notWhen: 'always, for now',
            status: 'planned',
            waitingFor: 'a screen that needs it',
          },
        ],
        rules: [{ id: 'X1', when: { task: ['browse'], carries: 'entity' }, choose: ['sketch'], because: 'nothing else exists here' }],
      } as unknown as CardRulesDoc,
      { collectionTasks: rules.collectionTasks },
    )
    const { problems } = planned.checkCardZone(zone({ card: 'sketch', components: ['Card'] }), 'cards')
    expect(problems.join('\n')).toMatch(/planned, not built/)
    expect(problems.join('\n')).toMatch(/a screen that needs it/)
  })

  it('leaves a Card that is only a surface alone', () => {
    const panel = { name: 'content', task: 'find', components: ['Card', 'Table'], data: { item: 'record' as const, cardinality: 'many' as const, fields: 8 } }
    expect(cards.checkCardZone(panel, reps.detect(panel)).problems).toEqual([])
  })

  it('notes the component nobody remembered to use', () => {
    const { notes } = cards.checkCardZone(
      zone({ task: 'navigate', card: 'entry', data: { item: 'record', cardinality: 'few', carries: 'destination' } }),
      'cards',
    )
    expect(notes.join('\n')).toMatch(/LinkTile/)
  })

  it('decides: a number that is monitored is a KPI card, not an object card', () => {
    const v = cards.chooseFamily('monitor', 'metric')
    expect(v.allowed).toContain('kpi')
    expect(v.allowed).not.toContain('object')
    expect(v.families.find((f) => f.id === 'kpi')?.anatomy.required).toContain('delta')
  })
})
