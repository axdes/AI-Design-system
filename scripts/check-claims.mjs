#!/usr/bin/env node
/**
 * The contract may not say a number the system disagrees with.
 *
 * There are three ways a written rule stops being true, and only two of them
 * were guarded here. A rule can be WRONG when written — that is poisoning, and
 * review catches it. A rule can point at code that changed — that is staleness,
 * and `gen-registry:check`, `llms:check` and `gen:data:check` catch it. And a
 * rule can be true when written and quietly stop being true, with nothing near
 * it changing at all. Nothing caught that, and on 2026-08-27 it had four live
 * instances:
 *
 *   - AGENTS.md taught "icon leads by default, pass `iconEnd`". The owner
 *     reversed that on 2026-06-10 and `.btn > .icon { order: 1 }` has been the
 *     rule ever since. The contract taught the opposite for three months, and
 *     every agent that read it believed the contract.
 *   - README.md promised 93 components and 31 gate steps against 131 and 36.
 *   - `editKinds.attribute` sat `planned`, waiting for a component that already
 *     existed under another name.
 *   - Four form kinds sat `planned` with every part they need already built.
 *
 * A number typed into prose is a claim with no owner. This makes the number the
 * system's to answer: the count comes from what is generated, the prose has to
 * agree, and a change in the system fails the contract that describes it rather
 * than being described wrongly for a quarter.
 *
 * WHAT IT DOES NOT DO. It does not read English. It checks the claims that can
 * be counted; a sentence that states a false RULE is still a review problem, and
 * the answer to that one is to keep the always-loaded file short enough to read.
 */
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const RED = '\x1b[31m', GREEN = '\x1b[32m', DIM = '\x1b[2m', BOLD = '\x1b[1m', OFF = '\x1b[0m'

const read = (p) => (existsSync(`${ROOT}/${p}`) ? readFileSync(`${ROOT}/${p}`, 'utf8') : null)
const json = (p) => JSON.parse(readFileSync(`${ROOT}/${p}`, 'utf8'))

const registry = json('component-registry.json')
const gate = json('public/data/gate.json')
const tokens = json('tokens/design.tokens.json')

let tokenCount = 0
const walk = (o) => { for (const v of Object.values(o)) if (v && typeof v === 'object') { if ('$value' in v) tokenCount++; else walk(v) } }
walk(tokens)

const layerCount = (file, key) => {
  const doc = json(`screen-specs/${file}`)
  return Object.keys(doc[key] ?? {}).length
}

/* Every countable claim the contract makes, and where the true number lives.
   `what` is the noun as the prose writes it; the pattern finds "<n> <noun>". */
const CLAIMS = [
  { what: 'components', actual: Object.keys(registry.components).length, nouns: ['components?'] },
  { what: 'blocks', actual: Object.keys(registry.blocks).length, nouns: ['blocks?', 'page templates?'] },
  { what: 'gate steps', actual: gate.steps.length, nouns: ['steps?', 'gate steps?', 'checks in the gate'] },
  { what: 'tokens', actual: tokenCount, nouns: ['tokens?'] },
  { what: 'card families', actual: layerCount('card-rules.json', 'families'), nouns: ['card families', 'families'] },
  { what: 'form kinds', actual: layerCount('form-rules.json', 'formKinds'), nouns: ['form kinds?'] },
  { what: 'table kinds', actual: layerCount('table-rules.json', 'tableKinds'), nouns: ['table kinds?'] },
  { what: 'cell kinds', actual: layerCount('cell-rules.json', 'cellKinds'), nouns: ['cell kinds?'] },
]

/* The files a stranger and an agent read as the truth. Nothing else is checked:
   the changelog is a record of what WAS true and must keep its old numbers. */
const FILES = ['AGENTS.md', 'README.md', 'llms.txt', '../../AGENTS.md']

const problems = []
let checked = 0

for (const file of FILES) {
  const src = read(file)
  if (!src) continue
  /* Fenced code and inline code are commands and output, not claims. */
  const prose = src.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '')
  for (const claim of CLAIMS) {
    for (const noun of claim.nouns) {
      const re = new RegExp(`\\b(\\d{1,4})\\s+(?:of\\s+)?${noun}\\b`, 'gi')
      for (const m of prose.matchAll(re)) {
        const said = Number(m[1])
        checked++
        /* A number in a range or a budget ("20-30 lines") is not a count of the
           system, and neither is a figure the prose itself marks as historical
           ("was 93 components"). Only a bare present-tense count is a claim. */
        const before = prose.slice(Math.max(0, m.index - 24), m.index)
        if (/\b(was|were|used to|until|before|up to|at least|about|around|over|under)\s*$/i.test(before)) continue
        if (/[-–]\s*$/.test(before)) continue
        if (said !== claim.actual) {
          problems.push(`${file}: says "${m[0].trim()}" — the system has ${claim.actual}`)
        }
      }
    }
  }
}

console.log(`${BOLD}Countable claims${OFF} ${DIM}${checked} in ${FILES.filter(read).length} file(s) an agent reads as the truth${OFF}`)

if (problems.length) {
  console.error(`\n${RED}✗ ${problems.length} claim(s) the system disagrees with:${OFF}`)
  for (const p of problems) console.error(`    ${p}`)
  console.error(`\n  ${DIM}Correct the prose, or stop typing the number: a count belongs to whatever`)
  console.error(`  generates it. A contract that is wrong about something countable is read`)
  console.error(`  as wrong about everything else too.${OFF}`)
  process.exit(1)
}
console.log(`${GREEN}✓ every countable claim matches the system.${OFF}`)
