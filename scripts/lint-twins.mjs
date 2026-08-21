// Discovery-first, as a check rather than an instruction.
//
// The contract says: search the registry before building. `npm run scout` holds
// the apps to that. Nothing held the SYSTEM to it, so the 74th component could
// repeat the 30th and every gate would stay green — the one place where a
// duplicate is most expensive, because every product inherits it.
//
// Two signals, and BOTH have to be high. Prop overlap alone is noise: two
// components with three props each can agree by accident, and on a first pass
// that is exactly what happened (Radio and Spinner scored a perfect 1.0 on two
// coincident names). Rendered-markup overlap alone is noise the other way, since
// most of this system is divs. Together they are specific: 82 entries, 1045
// pairs scored, one flagged.
//
// It prints its denominator, and that is not decoration. Both signals cost
// coverage — composition and the four-prop floor together decline two thirds of
// the pairs — and a check that reports only its failures reads as "nothing to
// find" when it means "I did not look". Every number in the header line is a
// question this check did not answer.
//
// Composition is not duplication. If one component imports the other, the second
// is built ON the first, which is the system working — those pairs are skipped
// before scoring, and it is what keeps IconButton clear of Button.
//
// A flagged pair is a question, not a verdict. Answer it by merging the two, or
// by recording the pair in twins.json with what genuinely separates them and
// what would make them one component again.
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/* The root is overridable so this linter can be pointed at a broken COPY of the
 * package and proven to bite. Nothing else sets it: `npm run` always lints here.
 * See scripts/linters.test.mjs — a linter with no negative test is a linter that
 * can stop working without anybody finding out. */
const ROOT = process.env.DS_LINT_ROOT ?? fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const RESET = '\x1b[0m', RED = '\x1b[31m', GREEN = '\x1b[32m', DIM = '\x1b[2m', BOLD = '\x1b[1m'

const reg = JSON.parse(readFileSync(`${ROOT}/component-registry.json`, 'utf8'))
const accepted = JSON.parse(readFileSync(`${ROOT}/twins.json`, 'utf8'))

/* Props every React component has. They carry no information about what the
 * component IS, so counting them would make everything look alike. */
const UNIVERSAL = new Set(['className', 'children', 'id', 'style', 'ref', 'key', 'aria-label', 'data-testid', 'onClick'])

/* Both signals must clear this. A weighted sum lets one high signal carry a low
 * one, which is how the noisy first pass happened. */
const THRESHOLD = 0.5

/* Below this, a prop set is too small for its overlap to mean anything. */
const MIN_PROPS = 4

/* The source of a registry entry. Usually `<ref>/<ref>.tsx`, and for a folder
 * that exports several parts (Layout ships Stack, Row and Grid under one entry)
 * every part file in it, unioned.
 *
 * It used to be the first line alone, and a folder shaped any other way returned
 * null and left the comparison SILENTLY — one entry of eighty-two was never
 * scored against anything and the output still said "73 components" as though
 * that were the whole system. A skip nobody prints is a skip nobody audits, so
 * this resolves what it can and the caller fails on what it cannot. */
function sourcesOf(entry) {
  const dir = `${ROOT}/src/components/${entry.ref}`
  if (existsSync(`${dir}/${entry.ref}.tsx`)) return [`${dir}/${entry.ref}.tsx`]
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((f) => f.endsWith('.tsx') && !f.includes('.example.') && !f.includes('.test.'))
    .map((f) => `${dir}/${f}`)
}

function shapeOf(name, entry) {
  const files = sourcesOf(entry)
  if (!files.length) return null
  const src = files.map((f) => readFileSync(f, 'utf8')).join('\n')
  return {
    name,
    parts: files.length,
    props: new Set((entry.props ?? []).map((p) => p.name).filter((p) => !UNIVERSAL.has(p))),
    renders: new Set([...src.matchAll(/<([A-Za-z][\w.]*)[\s/>]/g)].map((m) => m[1]).filter((t) => t !== name)),
    imports: new Set([...src.matchAll(/from\s+'[^']*\/([A-Z][\w]*)'/g)].map((m) => m[1])),
  }
}

const jaccard = (a, b) => {
  if (!a.size || !b.size) return 0
  let shared = 0
  for (const x of a) if (b.has(x)) shared++
  return shared / (a.size + b.size - shared)
}

const entries = Object.entries(reg.components)
const shapes = entries.map(([name, e]) => [name, shapeOf(name, e)])
const unreadable = shapes.filter(([, s]) => !s).map(([name]) => name)
const all = shapes.map(([, s]) => s).filter(Boolean)

const key = (a, b) => [a, b].sort().join(' ~ ')
const found = []
let compared = 0
let composed = 0
let tooSmall = 0

for (let i = 0; i < all.length; i++) {
  for (let j = i + 1; j < all.length; j++) {
    const a = all[i], b = all[j]
    if (a.imports.has(b.name) || b.imports.has(a.name)) { composed++; continue }
    if (a.props.size < MIN_PROPS || b.props.size < MIN_PROPS) { tooSmall++; continue }
    compared++
    const props = jaccard(a.props, b.props)
    const renders = jaccard(a.renders, b.renders)
    if (props < THRESHOLD || renders < THRESHOLD) continue
    found.push({
      pair: key(a.name, b.name),
      props: props.toFixed(2),
      renders: renders.toFixed(2),
      shared: [...a.props].filter((p) => b.props.has(p)),
    })
  }
}

/* The denominator, printed. Every number here is a pair this check did NOT
 * answer, and each of them used to be invisible: the output said how many
 * components it looked at and nothing about what it declined to score, so
 * a threshold could quietly exclude half the system with a green tick above it. */
const multi = all.filter((s) => s.parts > 1)
console.log(
  `${BOLD}Twins${RESET} ${DIM}${all.length} of ${entries.length} registry entries, ${compared} pairs compared, ` +
    `${composed} skipped as composition, ${tooSmall} as too few props (< ${MIN_PROPS})${RESET}`,
)
if (multi.length) {
  console.log(`${DIM}  ${multi.map((s) => `${s.name} (${s.parts} part files)`).join(', ')}${RESET}`)
}
console.log('')

/* A registry entry whose source cannot be found is not a decision, it is this
 * check losing a component. It scored 81 of 82 for as long as the resolver
 * assumed one shape of folder, and said nothing about the one it dropped. */
if (unreadable.length) {
  console.error(`${RED}✗ ${unreadable.length} registry entr(ies) have no source this check can read:${RESET}`)
  for (const n of unreadable) console.error(`    ${n}`)
  console.error(`\n  Fix the resolver or the folder — an entry nobody scores is a duplicate nobody finds.\n`)
  process.exit(1)
}

const news = found.filter((f) => !accepted.pairs[f.pair])
for (const f of found) {
  const note = accepted.pairs[f.pair]
  console.log(
    `  ${note ? GREEN + '✓' : RED + '✗'}${RESET} ${f.pair.padEnd(30)} ` +
      `${DIM}props ${f.props}, markup ${f.renders}${RESET}`,
  )
  if (note) console.log(`      ${DIM}${note.separated}${RESET}`)
}

/* A recorded pair that stopped resembling its twin has had its reason answered
 * by the code. Leaving the entry behind would quietly excuse a future twin. */
const stale = Object.keys(accepted.pairs).filter((p) => !found.some((f) => f.pair === p))

console.log('')
if (news.length) {
  console.error(`${RED}✗ ${news.length} pair(s) of components resemble each other and nobody has said why:${RESET}`)
  for (const f of news) {
    console.error(`    ${f.pair}`)
    console.error(`      ${DIM}shared props: ${f.shared.join(', ')}${RESET}`)
  }
  console.error(
    `\n  Either fold one into the other, or add the pair to twins.json with what` +
      `\n  separates them and what would make them one component again. A duplicate` +
      `\n  in the system is inherited by every product that consumes it.\n`,
  )
  process.exit(1)
}
if (stale.length) {
  console.error(`${RED}✗ ${stale.length} recorded pair(s) no longer resemble each other:${RESET}`)
  for (const p of stale) console.error(`    ${p}`)
  console.error(`\n  Remove them from twins.json — a stale excuse waives a future duplicate.\n`)
  process.exit(1)
}
console.log(`${GREEN}✓ no unexplained twin inside the system.${RESET}`)
