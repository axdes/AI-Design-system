// Check the files I just wrote, before a human has to.
//
// The gate answers "is the repository healthy" and takes minutes. That is the
// right tool for a commit and the wrong one for an agent that has just written a
// screen and wants to know whether it conforms — nobody, human or otherwise,
// runs a three-minute gate between edits, so nothing gets checked until review.
//
// The measurement that produced this: on 2026-08-01 the full eval set was run on
// two models. `style-hygiene` failed on three of nine tasks and every one of
// those failures was an inline style — a rule the contract states plainly and
// `lint:rules` already enforces. The agent could read the sentence asking it not
// to; it could not run the check that would have told it that it had. That is a
// missing connector, not a weaker model.
//
// So this exposes the conformance scorers the evals already use, pointed at
// arbitrary files, in seconds:
//
//   npm run verify -- src/layouts/Thing.tsx src/layouts/Thing.css
//   npm run verify -- --json <files>     machine-readable, for a tool caller
//
// It deliberately does NOT compile or render. Those need the file inside the
// project and cost seconds each; `npm run check` is where they belong. This
// answers one question — does this use the design system as the registry
// describes it — and answers it fast enough to be used every time.
import { appendFileSync, mkdirSync, readFileSync, existsSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { staticScore, DIMENSIONS } from '../evals/scorers.mjs'
import { deepCheckInPlace } from './lib/deep-check.mjs'

const ROOT = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const RESET = '\x1b[0m', RED = '\x1b[31m', GREEN = '\x1b[32m', DIM = '\x1b[2m', BOLD = '\x1b[1m'

const argv = process.argv.slice(2)
const json = argv.includes('--json')
/* Types and rendering. Slower (about six seconds against a tenth of one) and
 * worth it: over 27 measured agent runs those two accounted for 22 of 39
 * failures, and nothing the registry can be read for reaches either. */
const deep = argv.includes('--deep')
const paths = argv.filter((a) => !a.startsWith('--'))

if (!paths.length) {
  console.error('usage: npm run verify -- <file.tsx> [file.css …]')
  console.error('       one or more files that together make one screen or component')
  process.exit(2)
}

const files = {}
const absolute = []
for (const p of paths) {
  const full = p.startsWith('/') ? p : `${ROOT}/${p.replace(/^packages\/design-system\//, '')}`
  if (!existsSync(full) || statSync(full).isDirectory()) {
    console.error(`${RED}✗${RESET} no such file: ${p}`)
    process.exit(2)
  }
  files[p.split('/').pop()] = readFileSync(full, 'utf8')
  absolute.push(full)
}

const registry = JSON.parse(readFileSync(`${ROOT}/component-registry.json`, 'utf8'))

/* An eval candidate is one self-contained file, so "not in the registry and not
 * declared in this file" means invented. A real screen imports from the app it
 * lives in — its own shell, its own widgets — and calling those invented is a
 * false positive, which is the fastest way to teach anyone to ignore a check.
 *
 * The honest rule: inventing a component means using a tag you never imported
 * and never declared. Whether the import PATH is real is tsc's question, and it
 * is better at it than this would be; whether an app widget should have been a
 * registry component is `npm run scout`'s. This one asks neither. */
const imported = new Set()
for (const src of Object.values(files)) {
  for (const m of src.matchAll(/import\s+(?:type\s+)?(?:(\w+)\s*,\s*)?(?:\{([^}]*)\}|(\w+))\s+from\s+["'][^"']+["']/g)) {
    for (const n of [m[1], m[3], ...(m[2] ?? '').split(',')].filter(Boolean)) {
      const name = n.trim().split(/\s+as\s+/).pop()
      if (/^[A-Z]/.test(name)) imported.add(name)
    }
  }
}

/* No rubric: `required-used` and `no-hand-rolling` are per-TASK expectations that
 * only the evals have. The four that remain are true of any file in this system. */
const { findings } = staticScore(files, { registry })
findings['components-exist'] = (findings['components-exist'] ?? [])
  .filter((line) => !imported.has(/<([A-Za-z][\w.]*)/.exec(line)?.[1]?.split('.')[0]))
let checked = DIMENSIONS.filter((d) => !['required-used', 'no-hand-rolling'].includes(d))

if (deep) {
  /* The entry is the file that exports a component; a screen plus its CSS is the
   * usual call, and only one of them can be mounted. */
  Object.assign(findings, deepCheckInPlace({ root: ROOT, paths: absolute }))
  checked = [...checked, 'compiles', 'renders']
}

if (json) {
  const out = Object.fromEntries(checked.map((d) => [d, findings[d] ?? []]))
  const total = Object.values(out).reduce((n, v) => n + v.length, 0)
  console.log(JSON.stringify({ ok: total === 0, files: paths, findings: out }, null, 2))
  process.exit(total === 0 ? 0 : 1)
}

/* Every invocation is recorded next to the eval traces. Without this, "verify
 * was available" and "verify was used" are indistinguishable, and an experiment
 * that cannot tell those apart cannot conclude anything about either. */
try {
  mkdirSync(`${ROOT}/evals/.traces`, { recursive: true })
  appendFileSync(
    `${ROOT}/evals/.traces/verify.jsonl`,
    JSON.stringify({
      at: new Date().toISOString(),
      /* WHICH mode. Without it the log cannot answer whether `--deep` was ever
       * used, which is the exact question the last experiment needed. */
      deep,
      files: paths,
      problems: checked.reduce((n, d) => n + (findings[d] ?? []).length, 0),
    }) + '\n',
  )
} catch { /* a read-only checkout must not fail the check */ }

console.log(`${BOLD}Verify${RESET} ${DIM}${paths.length} file(s) against the registry${RESET}\n`)

let failed = 0
for (const d of checked) {
  const f = findings[d] ?? []
  if (!f.length) { console.log(`  ${GREEN}✓${RESET} ${DIM}${d}${RESET}`); continue }
  failed += f.length
  console.log(`  ${RED}✗ ${d}${RESET} ${DIM}(${f.length})${RESET}`)
  for (const line of f) console.log(`      ${line}`)
}

console.log('')
if (failed) {
  console.error(`${RED}✗ ${failed} conformance problem(s).${RESET}`)
  console.error(`  ${DIM}Every one of these is answerable from component-registry.json.${RESET}`)
  console.error(`  ${DIM}This is not the gate: run \`npm run check\` before committing.${RESET}\n`)
  process.exit(1)
}
console.log(`${GREEN}✓ conforms to the registry.${RESET}`)
console.log(`${DIM}  Not the gate — types, tests, a11y and the visual baselines are in \`npm run check\`.${RESET}`)
