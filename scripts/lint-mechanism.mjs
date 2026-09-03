#!/usr/bin/env node
/* The same BEHAVIOUR written twice, which is not the same question as the same
 * text written twice.
 *
 * `lint:dup` is jscpd over src and styles. On 2026-09-02 it reported under its
 * threshold and passed, while Tooltip and HoverCard each built their own portal,
 * measured their own trigger rect, read their own viewport, ran their own timer
 * and cloned their own child; and while Dropdown and TreeTable each wrote the
 * list navigation that src/lib/useListNavigation.ts already owns. Not one line
 * matched between them: they were written independently, and every one of them
 * did the same thing. Token similarity is the wrong measure for behaviour.
 *
 * So the signature is what a file DOES — which browser events it binds, whether
 * it portals, whether it measures, whether it clamps an index against a bound —
 * and two files with the same signature are one mechanism written twice.
 *
 * Two exemptions, both of them the rule rather than mercy:
 *
 *   COMPOSITION. If one file imports the other, the second is built ON the
 *   first. lint:twins already makes this exemption for the same reason.
 *
 *   A SHARED MECHANISM IS NOT DUPLICATION. A pair's shared imports are
 *   subtracted before comparing, so what is left is what each file does ON ITS
 *   OWN. Without this, every part that calls useAnchoredLayer looks like every
 *   other one, because they all still hold the geometry the hook hands them —
 *   which is the hook's contract, not a defect.
 *
 * Containment, not Jaccard: the question is not "are these the same size and
 * shape", it is "is one of them redoing what the other already does". A Tooltip
 * whose signals are a subset of a Dropdown's would score 0.54 on Jaccard and
 * hide.
 *
 * AGAINST A CEILING. Ten pairs stood the day this landed, and a check that has
 * to wait for them to be paid off is a check that never lands. Each recorded
 * pair carries a reason and what would close it; an unrecorded pair fails.
 *
 * POPULATION: every .ts/.tsx file under src, walked. Not a list — a list cannot
 * know what is missing from it.
 *
 *   npm run lint:mechanism             hold src to the recorded pairs
 *   npm run lint:mechanism -- --record write today's pairs in, reasons blank
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = process.env.DS_LINT_ROOT ?? fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const RESET = '\x1b[0m', RED = '\x1b[31m', GREEN = '\x1b[32m', DIM = '\x1b[2m', BOLD = '\x1b[1m'
const record = process.argv.includes('--record')
const DEBT = `${ROOT}/config/mechanism-debt.json`

/* What a file DOES. Every one of these is a thing a person writes on purpose,
 * and several of them together are a mechanism rather than a coincidence. */
const SIGNALS = {
  'listen:scroll': /addEventListener\(\s*['"]scroll/,
  'listen:resize': /addEventListener\(\s*['"]resize/,
  'listen:keydown': /addEventListener\(\s*['"]keydown/,
  'listen:pointerdown': /addEventListener\(\s*['"](mousedown|pointerdown)/,
  'portal': /createPortal/,
  'measure:rect': /getBoundingClientRect/,
  'measure:viewport': /window\.(innerWidth|innerHeight)/,
  'throttle:raf': /requestAnimationFrame/,
  'observe': /(Resize|Intersection|Mutation)Observer/,
  'timer': /setTimeout|setInterval/,
  'position:state': /useState<[^>]*\b(top|left|Position|Placement|Resolved)\b/,
  'key:arrows': /['"]Arrow(Down|Up)['"]/,
  'key:homeend': /['"](Home|End)['"]/,
  'key:escape': /['"]Escape['"]/,
  'clamp:index': /Math\.(min|max)\([^)]*\b(i|index|active)\b/,
  'focus:move': /\.focus\(\)/,
  'rtl': /documentElement\.dir/,
  'clone:child': /cloneElement/,
}

/* A shared set of cheap signals is a coincidence. At least one of these has to
 * be in it before two files are called one mechanism: they are the parts nobody
 * writes twice by accident. */
const EXPENSIVE = new Set(['measure:rect', 'portal', 'listen:scroll', 'throttle:raf', 'clamp:index', 'observe'])

const SKIP = /node_modules|\/dist|__eval__|__verify__/
function walk(dir, out = []) {
  if (!existsSync(dir)) return out
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) { if (!SKIP.test(path)) walk(path, out) }
    else if (/\.tsx?$/.test(entry) && !/\.(test|example|stories)\./.test(entry)) out.push(path)
  }
  return out
}
const strip = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const base = (path) => path.split('/').pop().replace(/\.tsx?$/, '')

/** file → { signals, imports }, for every file that does at least three things. */
export function signatures(root) {
  const out = new Map()
  for (const file of walk(root)) {
    const src = strip(readFileSync(file, 'utf8'))
    const sig = new Set()
    for (const [name, re] of Object.entries(SIGNALS)) if (re.test(src)) sig.add(name)
    if (sig.size >= 3) out.set(file, { sig, imports: [...src.matchAll(/from '([^']+)'/g)].map((m) => m[1]) })
  }
  return out
}

const containment = (a, b) => [...a].filter((x) => b.has(x)).length / Math.min(a.size, b.size)

export function findDuplicates(root, threshold = 0.7) {
  const sigs = signatures(root)
  const files = [...sigs.keys()]
  const byName = new Map(files.map((f) => [base(f), sigs.get(f)]))

  /** What a file does on its own, once its imported mechanisms are subtracted. */
  const own = (entry) => {
    const shared = new Set()
    for (const spec of entry.imports) {
      const imported = byName.get(base(spec))
      if (imported && imported !== entry) for (const signal of imported.sig) shared.add(signal)
    }
    return new Set([...entry.sig].filter((x) => !shared.has(x)))
  }

  const hits = []
  for (let i = 0; i < files.length; i++) {
    for (let j = i + 1; j < files.length; j++) {
      const A = sigs.get(files[i]), B = sigs.get(files[j])
      if (A.imports.some((m) => base(m) === base(files[j]))) continue
      if (B.imports.some((m) => base(m) === base(files[i]))) continue
      const aOwn = own(A), bOwn = own(B)
      if (aOwn.size < 3 || bOwn.size < 3) continue
      const shared = [...aOwn].filter((x) => bOwn.has(x))
      const score = +containment(aOwn, bOwn).toFixed(2)
      if (score >= threshold && shared.length >= 3 && shared.some((x) => EXPENSIVE.has(x))) {
        hits.push({ pair: [base(files[i]), base(files[j])].sort().join(' ~ '), score, shared, files: [relative(root, files[i]), relative(root, files[j])] })
      }
    }
  }
  return hits.sort((a, b) => b.score - a.score || a.pair.localeCompare(b.pair))
}

if (import.meta.url !== `file://${process.argv[1]}`) {
  /* imported by a test */
} else {
  const hits = findDuplicates(`${ROOT}/src`)
  const debt = existsSync(DEBT) ? JSON.parse(readFileSync(DEBT, 'utf8')) : null

  if (record) {
    const held = debt?.pairs ?? {}
    const pairs = Object.fromEntries(hits.map((h) => [h.pair, held[h.pair] ?? '']))
    writeFileSync(DEBT, `${JSON.stringify({
      _why: 'The mechanisms written twice on the day lint:mechanism landed, each with the reason it still stands and what would close it. Recorded by npm run lint:mechanism -- --record, which leaves the reason blank; a pair with no reason fails, because a pair carried without one is the silence this check exists to end. A pair not in this file fails outright: the number only falls.',
      recorded: new Date().toISOString().slice(0, 10),
      pairs,
    }, null, 2)}\n`)
    const blank = Object.entries(pairs).filter(([, why]) => !why).length
    console.log(`${GREEN}✓${RESET} recorded ${hits.length} pair(s) in config/mechanism-debt.json${blank ? ` ${DIM}${blank} still need a reason${RESET}` : ''}`)
    process.exit(0)
  }

  console.log(`${BOLD}Mechanisms${RESET} ${DIM}${signatures(`${ROOT}/src`).size} files that do three or more things — ${hits.length} pair(s) at 0.7 or above${RESET}\n`)

  if (!debt) {
    for (const h of hits) console.log(`  ${h.score}  ${h.pair}\n        ${DIM}${h.shared.join(' · ')}${RESET}`)
    console.log(`\nmechanism: no pairs recorded yet. ${DIM}Run npm run lint:mechanism -- --record once, write a reason against each, and commit config/mechanism-debt.json.${RESET}`)
    process.exit(0)
  }

  const problems = []
  for (const h of hits) {
    const why = debt.pairs?.[h.pair]
    if (why === undefined) {
      problems.push(`${RED}${h.pair}${RESET} ${DIM}${h.score}${RESET}  one mechanism written twice, and not on the ceiling\n      ${h.shared.join(' · ')}\n      ${h.files.join('  ')}\n      Call the mechanism one of them already has, take the shared half into src/lib, or record the pair in config/mechanism-debt.json with the reason this one is different.`)
    } else if (!String(why).trim()) {
      problems.push(`${RED}${h.pair}${RESET}  recorded with no reason\n      A pair carried without a reason is the silence this check exists to end. Say why it still stands and what would close it.`)
    }
  }
  const gone = Object.keys(debt.pairs ?? {}).filter((p) => !hits.some((h) => h.pair === p))
  if (gone.length) {
    console.log(`${GREEN}${gone.length} paid off${RESET} ${DIM}run npm run lint:mechanism -- --record to write the lower number in${RESET}`)
    for (const p of gone) console.log(`  ${DIM}${p}${RESET}`)
    console.log()
  }

  if (!problems.length) {
    console.log(`${GREEN}✓${RESET} every pair is one of the ${Object.keys(debt.pairs ?? {}).length} recorded ${debt.recorded}, each with a reason.`)
    process.exit(0)
  }
  console.error(`${RED}${problems.length} finding(s)${RESET}\n`)
  for (const p of problems) console.error(`  ${p}\n`)
  process.exit(1)
}
