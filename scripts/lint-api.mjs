#!/usr/bin/env node
/* The public API of the whole catalogue, held to four rules.
 *
 *   A1  one prop name, ONE TYPE, everywhere
 *   A2  a part past seven props is a compound, or records why not
 *   A3  callbacks come from a closed list
 *   A4  no part without a test
 *
 * A1 is the reason this exists. `lint:vocab` holds the shared props to one set
 * of VALUES — `tone` on Alert accepts what `tone` on Progress accepts — and has
 * never looked at the SHAPE. So on 2026-09-02, with every gate green, 54 prop
 * names resolved to 163 different types: `label` on 50 parts as both `string`
 * and `ReactNode`, `size` on 43 with four unions, `onChange` on 18 with four
 * signatures, `surface` on 12 answering two unrelated questions. An agent
 * cannot learn a word that means two things; it looks it up every time, which
 * is the cost this system exists to remove.
 *
 * A2, A3 and A4 come from the same measurement: 42 parts past seven props
 * (Page 22, Chart 16, FilterDropdown 15), 32 callback names for about eight
 * ideas, 62 of 138 parts with no test file at all.
 *
 * ALL FOUR RUN AGAINST A CEILING, not against zero. Numbers that large cannot
 * be fixed in the commit that starts measuring them, and a check switched off
 * until the debt is paid is a check that never lands. config/api-debt.json is
 * the opening balance, recorded once; from here a name may not gain a type, a
 * part may not gain a prop, a callback may not spread to a new part, and a new
 * part may not arrive untested. The ceiling only falls.
 *
 * POPULATION: derived from component-registry.json, which is generated from the
 * source, so nothing can be missing from a hand-written list.
 *
 *   npm run lint:api             hold the API to the recorded ceiling
 *   npm run lint:api -- --record write today's numbers in as the ceiling
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/* Overridable so the linter can be pointed at a deliberately broken COPY of the
 * package and proven to bite — the same contract every other linter here runs
 * under. See scripts/linters.test.mjs. */
const ROOT = process.env.DS_LINT_ROOT ?? fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const RESET = '\x1b[0m', RED = '\x1b[31m', GREEN = '\x1b[32m', DIM = '\x1b[2m', BOLD = '\x1b[1m'
const record = process.argv.includes('--record')

const registry = JSON.parse(readFileSync(`${ROOT}/component-registry.json`, 'utf8'))
const vocab = JSON.parse(readFileSync(`${ROOT}/config/callback-vocabulary.json`, 'utf8'))
/* The words of the shared props are somebody else's job. config/prop-vocabulary.json
 * declares them and lint:vocab holds every part to them, including the two that
 * look like drift from here and are not: `info` on an Alert and `destructive` on
 * a button are declared words with arguments behind them (a destructive ACTION
 * is not a bad STATE, which is Apple HIG and Material alike). A1 is about SHAPE,
 * so for a governed prop it asks only whether every part publishes a union of
 * the declared words — and if they do, they are one type wearing different
 * subsets. (2026-09-03) */
const propWords = JSON.parse(readFileSync(`${ROOT}/config/prop-vocabulary.json`, 'utf8'))
const governed = new Map(
  Object.entries(propWords)
    .filter(([k]) => k !== '_')
    .map(([name, def]) => [name, new Set(Object.keys(def.values ?? {}))]),
)
const DEBT = `${ROOT}/config/api-debt.json`
const debt = existsSync(DEBT) ? JSON.parse(readFileSync(DEBT, 'utf8')) : null

/** Every part with a public API, components and blocks alike. */
const parts = Object.entries({ ...registry.components, ...registry.blocks })
  .map(([name, entry]) => ({ name, ...entry }))
  .sort((a, b) => a.name.localeCompare(b.name))

/* ── A1 ─────────────────────────────────────────────────────────────────── */

/* A ref points at whatever element a part renders and `children` is whatever it
 * wraps: both differ by construction and neither is a word a caller has to
 * LEARN twice. Everything else is. */
const STRUCTURAL = /^(ref|children)$/
const shapeOf = (name, type) =>
  STRUCTURAL.test(name) ? name : String(type ?? '').replace(/\s+/g, ' ').trim()

/* A NARROWER UNION IS NOT A DIFFERENT TYPE.
 *
 * `size: 'sm' | 'md'` on a Badge and `size: 'sm' | 'md' | 'lg'` on a Button are
 * not two answers to one question: they are one vocabulary, and a part offering
 * fewer steps of it. A caller who learned `size="sm"` is right in both places,
 * which is the test A1 actually cares about — the failure it exists for is a
 * name that means two different QUESTIONS (`surface` as 'base' | 'muted' in one
 * place and 'card' | 'page' in another) or two different SHAPES (a string here,
 * a function there).
 *
 * So a union whose words are a subset of another union's words folds into the
 * wider one and is reported as a narrowing rather than counted as drift. Two
 * unions that disagree about the words are still two types. This is the
 * difference the check could not see until the registry stopped publishing type
 * ALIASES and started publishing the unions themselves (2026-09-03) — before
 * that, `Size` and `Size` looked identical and were not.
 *
 * lint:vocab is what holds those words to one vocabulary; this holds the shape. */
const wordsOf = (type) => {
  const words = [...String(type).matchAll(/'([^']*)'/g)].map((m) => m[1])
  const onlyLiterals = String(type).replace(/'[^']*'/g, '').replace(/[|\s]/g, '') === ''
  return words.length && onlyLiterals ? new Set(words) : null
}
const subsumes = (wide, narrow) => [...narrow].every((w) => wide.has(w))

/** Fold each union into the widest union of the same vocabulary. */
function foldNarrowings(name, byType) {
  const unions = [...byType.keys()].map((t) => [t, wordsOf(t)]).filter(([, w]) => w)
  if (unions.length < 2) return { byType, folded: [] }

  /* A GOVERNED PROP IS ONE TYPE WHEN EVERY PART SPEAKS THE DECLARED WORDS.
   * Which of them a part offers is lint:vocab's question and it asks it
   * properly, per value, with a reason required for each. Counting the subsets
   * here would report the same fact twice and in a worse form. */
  const words = governed.get(name)
  if (words && unions.length === byType.size && unions.every(([, ws]) => [...ws].every((w) => words.has(w)))) {
    const widest = unions.reduce((a, b) => (b[1].size > a[1].size ? b : a))[0]
    const folded = unions.filter(([t]) => t !== widest).map(([t]) => ({ narrow: t, wide: widest, parts: byType.get(t) }))
    return { byType: new Map([[widest, [...byType.values()].flat()]]), folded }
  }
  const out = new Map()
  const folded = []
  for (const [type, parts] of byType) {
    const words = wordsOf(type)
    const wider = words && unions.find(([other, otherWords]) => other !== type && otherWords.size > words.size && subsumes(otherWords, words))
    if (wider) {
      folded.push({ narrow: type, wide: wider[0], parts })
      out.set(wider[0], [...(out.get(wider[0]) ?? []), ...parts])
      continue
    }
    out.set(type, [...(out.get(type) ?? []), ...parts])
  }
  return { byType: out, folded }
}

/** prop name → Map(type → the parts that publish it that way). */
const shapes = new Map()
for (const part of parts) {
  for (const prop of part.props ?? []) {
    if (!shapes.has(prop.name)) shapes.set(prop.name, new Map())
    const byType = shapes.get(prop.name)
    const key = shapeOf(prop.name, prop.type)
    byType.set(key, [...(byType.get(key) ?? []), part.name])
  }
}
const narrowings = []
const drift = [...shapes]
  .map(([name, byType]) => {
    const { byType: folded, folded: notes } = foldNarrowings(name, byType)
    if (notes.length) narrowings.push({ name, notes })
    return { name, types: folded, uses: [...folded.values()].flat().length }
  })
  .filter((d) => d.types.size > 1)
  .sort((a, b) => b.uses - a.uses)

/* ── A2 ─────────────────────────────────────────────────────────────────── */

/* aria-* is the platform's vocabulary, not this system's, and neither ref nor
 * children is a decision a caller makes. */
const publicProps = (part) =>
  (part.props ?? []).filter((p) => !STRUCTURAL.test(p.name) && !p.name.startsWith('aria-'))

const sourceOf = (part) => (part.sourcePath ? join(ROOT, part.sourcePath) : null)
const saysWhy = (part) => {
  const file = sourceOf(part)
  return !!file && existsSync(file) && /monolithic because|not a compound because/i.test(readFileSync(file, 'utf8'))
}
const wide = parts
  .map((p) => ({ name: p.name, count: publicProps(p).length, excused: saysWhy(p) }))
  .filter((p) => p.count > 7 && !p.excused)

/* ── A3 ─────────────────────────────────────────────────────────────────── */
const canonical = new Set(Object.keys(vocab.canonical))
const exceptions = vocab.exceptions ?? {}
const callbacks = new Map()
for (const part of parts) {
  for (const prop of part.props ?? []) {
    if (!/^on[A-Z]/.test(prop.name)) continue
    callbacks.set(prop.name, [...(callbacks.get(prop.name) ?? []), part.name])
  }
}

/* ── A4 ─────────────────────────────────────────────────────────────────── */
const hasTest = (part) => {
  const file = sourceOf(part)
  if (!file) return false
  const dir = dirname(file)
  return existsSync(dir) && readdirSync(dir).some((f) => /\.test\.(tsx?|mts)$/.test(f))
}
const untested = parts.filter((p) => !hasTest(p)).map((p) => p.name)

/* ── record ─────────────────────────────────────────────────────────────── */
if (record) {
  const next = {
    _why: 'The opening balance for npm run lint:api, recorded by npm run lint:api -- --record. Each number is a ceiling that may only fall: a prop name may not gain a type, a part may not gain a prop, a callback outside the vocabulary may not spread to a new part, and a new part may not arrive untested. Re-record after a payment, never to make a failure go away.',
    recorded: new Date().toISOString().slice(0, 10),
    shapes: Object.fromEntries(drift.map((d) => [d.name, d.types.size]).sort((a, b) => a[0].localeCompare(b[0]))),
    props: Object.fromEntries(wide.map((p) => [p.name, p.count]).sort((a, b) => a[0].localeCompare(b[0]))),
    callbacks: Object.fromEntries(
      [...callbacks].filter(([n]) => !canonical.has(n)).map(([n, ps]) => [n, [...ps].sort()]).sort((a, b) => a[0].localeCompare(b[0])),
    ),
    untested: [...untested].sort(),
  }
  writeFileSync(DEBT, `${JSON.stringify(next, null, 2)}\n`)
  console.log(
    `${GREEN}✓${RESET} recorded the ceiling in config/api-debt.json ${DIM}` +
      `${Object.keys(next.shapes).length} names with more than one type, ` +
      `${Object.keys(next.props).length} parts past seven props, ` +
      `${Object.keys(next.callbacks).length} callbacks outside the vocabulary, ` +
      `${next.untested.length} parts without a test${RESET}`,
  )
  process.exit(0)
}

if (!debt) {
  console.log(`api: no ceiling recorded yet. ${DIM}Run npm run lint:api -- --record once, and commit config/api-debt.json.${RESET}`)
  process.exit(0)
}

/* ── the four rules, against the ceiling ────────────────────────────────── */
const problems = []
const paid = []
const say = (rule, where, msg, fix) => problems.push({ rule, where, msg, fix })

for (const d of drift) {
  const held = debt.shapes?.[d.name]
  if (held === undefined) {
    say('A1', d.name, `resolves to ${d.types.size} different types, and is not on the ceiling`,
      `one name, one TYPE — not one meaning, because a caller writes the type:\n${[...d.types].map(([t, ps]) => `          ${t || '(none)'}  ${DIM}${ps.slice(0, 4).join(', ')}${ps.length > 4 ? ` +${ps.length - 4}` : ''}${RESET}`).join('\n')}\n      Give it one type, or rename one of them. A word that means two things is a word an agent looks up every time.`)
  } else if (d.types.size > held) {
    say('A1', d.name, `now resolves to ${d.types.size} types, up from ${held}`,
      `the ceiling only falls. The new shape is one of:\n${[...d.types].map(([t, ps]) => `          ${t || '(none)'}  ${DIM}${ps.slice(0, 4).join(', ')}${RESET}`).join('\n')}`)
  } else if (d.types.size < held) paid.push(`${d.name}: ${held} → ${d.types.size} types`)
}
for (const [name, held] of Object.entries(debt.shapes ?? {})) {
  if (!drift.some((d) => d.name === name)) paid.push(`${name}: ${held} types → one`)
}

for (const p of wide) {
  const held = debt.props?.[p.name]
  if (held === undefined) {
    say('A2', p.name, `takes ${p.count} props and is not on the ceiling`,
      'a part past seven is a compound that was never taken apart. Split it into parts rather than flags, or write "monolithic because …" in the file and say what the split would cost.')
  } else if (p.count > held) {
    say('A2', p.name, `takes ${p.count} props, up from ${held}`,
      'the answer to a part that is already too wide is never one more prop. Take the new behaviour out as a part, or pay the ceiling down first.')
  } else if (p.count < held) paid.push(`${p.name}: ${held} → ${p.count} props`)
}

for (const [name, users] of callbacks) {
  if (canonical.has(name)) continue
  const held = debt.callbacks?.[name]
  if (held === undefined) {
    const suggestion = exceptions[name]?.use
    say('A3', name, 'is not in the callback vocabulary',
      `the system says: ${[...canonical].join(', ')}.${suggestion ? ` This one reads as ${suggestion}.` : ''} A new callback name is a change to the vocabulary and is argued for in config/callback-vocabulary.json, not invented at the call site — 32 names covered about eight ideas on the day this check landed.`)
    continue
  }
  if (!exceptions[name]) {
    say('A3', name, 'is on the ceiling but nowhere in the vocabulary',
      'a name carried as debt still has to say what it means and which of the six it reads as. Add it to config/callback-vocabulary.json under exceptions, or the ceiling is a place names hide.')
    continue
  }
  const spread = users.filter((u) => !held.includes(u))
  if (spread.length) {
    say('A3', name, `spread to ${spread.join(', ')}`,
      `a name outside the vocabulary is debt, and debt does not grow. ${exceptions[name]?.use ? `Use ${exceptions[name].use} on the new part` : 'Use a name from the vocabulary'}, or argue the name into config/callback-vocabulary.json.`)
  }
}

for (const name of untested) {
  if (debt.untested?.includes(name)) continue
  say('A4', name, 'has no test',
    'no admission without a test. Coverage percentage is not the measure; existence is — 62 of 138 parts had no test file at all on the day this check landed, and a part nobody tests is a part nobody can refactor.')
}
paid.push(...(debt.untested ?? []).filter((n) => !untested.includes(n)).map((n) => `${n}: now tested`))

/* ── the report ─────────────────────────────────────────────────────────── */
const nShapes = drift.length
const nTypes = drift.reduce((n, d) => n + d.types.size, 0)
const narrowed = narrowings.reduce((n, x) => n + x.notes.length, 0)
console.log(
  `${BOLD}API${RESET} ${DIM}${parts.length} parts, ${shapes.size} prop names — ${nShapes} carry more than one type (${nTypes} shapes), ` +
    `${wide.length} past seven props, ${callbacks.size - [...callbacks.keys()].filter((c) => canonical.has(c)).length} callbacks outside the vocabulary, ${untested.length} without a test${RESET}`,
)
if (narrowed) {
  console.log(`  ${DIM}${narrowed} narrower union(s) folded into the wider vocabulary they belong to — a part offering fewer steps is not a second answer${RESET}`)
}
console.log()

if (paid.length) {
  console.log(`${GREEN}${paid.length} below the ceiling${RESET} ${DIM}run npm run lint:api -- --record to write the lower number in${RESET}`)
  for (const p of paid.slice(0, 8)) console.log(`  ${DIM}${p}${RESET}`)
  if (paid.length > 8) console.log(`  ${DIM}+${paid.length - 8} more${RESET}`)
  console.log()
}

if (!problems.length) {
  console.log(`${GREEN}✓${RESET} the API is at or under the ceiling recorded ${debt.recorded}.`)
  process.exit(0)
}

const byRule = new Map()
for (const p of problems) {
  if (!byRule.has(p.rule)) byRule.set(p.rule, [])
  byRule.get(p.rule).push(p)
}
const TITLE = {
  A1: 'one prop name, one type',
  A2: 'seven props, then compound',
  A3: 'callbacks come from a closed list',
  A4: 'no part without a test',
}
console.error(`${RED}${problems.length} finding(s)${RESET}\n`)
for (const [rule, list] of [...byRule].sort()) {
  console.error(`${BOLD}${rule}${RESET} ${TITLE[rule]} ${DIM}(${list.length})${RESET}`)
  for (const p of list) console.error(`  ${RED}${p.where}${RESET}  ${p.msg}\n      ${p.fix}\n`)
}
process.exit(1)
