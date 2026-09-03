#!/usr/bin/env node
/* The same question gets the same answer, whatever order it is asked in.
 *
 * Eight decision layers is the thing that makes this a design system rather
 * than a catalogue, and every one of them rests on a promise nothing checked:
 * that the answer comes from the declared facts and from nothing else. An
 * engine that iterates an object and lets the first match win is
 * order-dependent, looks deterministic for months, and starts lying the day
 * somebody reorders a JSON file for tidiness. selection-rules.json carries a
 * `precedence` list precisely because that already bit once.
 *
 * So every zone of every screen spec is decided twice: once as written, once
 * with the facts in a different order AND the rule document shuffled — the
 * representations, the components inside each representation, the card
 * families. The two verdicts must be identical, character for character. Not
 * "the same decision": the same verdict, because two runs that reach one answer
 * through different rules mean a rule is either wrong or unnecessary, and
 * neither is visible from the answer alone.
 *
 * Shuffled with a fixed seed, so a failure here is reproducible rather than a
 * story about a Tuesday.
 *
 * POPULATION: derived — every spec in screen-specs/ and every rule document the
 * spec check loads.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { makeRuleEngine, makeCardEngine } from './lib/spec-rules.mjs'

const ROOT = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const DIR = `${ROOT}/screen-specs`
const RESET = '\x1b[0m', RED = '\x1b[31m', GREEN = '\x1b[32m', DIM = '\x1b[2m', BOLD = '\x1b[1m'

/* A deterministic shuffle: mulberry32, so the same seed gives the same order on
 * every machine and a failure can be reproduced from the message. */
const rng = (seed) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
function shuffle(value, next) {
  if (Array.isArray(value)) {
    const out = value.map((v) => shuffle(v, next))
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1))
      ;[out[i], out[j]] = [out[j], out[i]]
    }
    return out
  }
  if (value && typeof value === 'object') {
    const keys = Object.keys(value)
    for (let i = keys.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1))
      ;[keys[i], keys[j]] = [keys[j], keys[i]]
    }
    return Object.fromEntries(keys.map((k) => [k, shuffle(value[k], next)]))
  }
  return value
}

/* The ORDER of a verdict is not part of it: a check that collects problems from
 * two shuffled sources may report them in a different order and still have said
 * the same thing. What must not change is WHICH problems and notes there are. */
const verdict = (r) => JSON.stringify({ problems: [...r.problems].sort(), notes: [...r.notes].sort(), unchecked: !!r.unchecked })

const specs = readdirSync(DIR)
  .filter((f) => f.endsWith('.json') && !f.endsWith('-rules.json') && !f.includes('.schema.'))
  .map((f) => ({ id: f.replace(/\.json$/, ''), doc: JSON.parse(readFileSync(`${DIR}/${f}`, 'utf8')) }))

const selectionDoc = JSON.parse(readFileSync(`${DIR}/selection-rules.json`, 'utf8'))
const cardDoc = JSON.parse(readFileSync(`${DIR}/card-rules.json`, 'utf8'))

const problems = []
let zones = 0

/* The precedence list is the one thing NOT shuffled: it is a declared order and
 * shuffling it would be asking whether a decision changes when the decision is
 * changed. Everything else — which representation is written first, which
 * component is listed first, the key order of every zone — carries no meaning
 * and must carry no weight. */
for (const seed of [1, 7, 1337]) {
  const next = rng(seed)
  const shuffledSelection = { ...shuffle(selectionDoc, next), precedence: selectionDoc.precedence, collectionTasks: selectionDoc.collectionTasks }
  const shuffledCards = { ...shuffle(cardDoc, next) }

  const plain = { selection: makeRuleEngine(selectionDoc), cards: makeCardEngine(cardDoc, { collectionTasks: selectionDoc.collectionTasks }) }
  const mixed = { selection: makeRuleEngine(shuffledSelection), cards: makeCardEngine(shuffledCards, { collectionTasks: selectionDoc.collectionTasks }) }

  for (const { id, doc } of specs) {
    for (const zone of doc.zones ?? []) {
      if (seed === 1) zones++
      const shuffledZone = shuffle(zone, next)
      const a = verdict(plain.selection.checkZone(zone))
      const b = verdict(mixed.selection.checkZone(shuffledZone))
      if (a !== b) {
        problems.push(`${id} · zone "${zone.name}" (seed ${seed}): the selection layer answers differently when the facts are in another order\n      as written: ${a}\n      shuffled:   ${b}`)
      }
      if (typeof plain.cards.checkZone === 'function') {
        const c = verdict(plain.cards.checkZone(zone, doc))
        const d = verdict(mixed.cards.checkZone(shuffledZone, doc))
        if (c !== d) {
          problems.push(`${id} · zone "${zone.name}" (seed ${seed}): the card layer answers differently when the facts are in another order\n      as written: ${c}\n      shuffled:   ${d}`)
        }
      }
    }
  }
}

console.log(`${BOLD}Determinism${RESET} ${DIM}${specs.length} spec(s), ${zones} zone(s), decided under three shuffles of the facts and of the rules${RESET}\n`)
if (!problems.length) {
  console.log(`${GREEN}✓${RESET} every zone reaches the same verdict whatever order it is asked in.`)
  process.exit(0)
}
console.error(`${RED}${problems.length} zone(s) whose answer depends on the order of the question${RESET}\n`)
for (const p of problems.slice(0, 20)) console.error(`  ${RED}·${RESET} ${p}\n`)
console.error(`  ${DIM}A rule that fires on whichever fact it happens to see first is not a rule.${RESET}`)
process.exit(1)
