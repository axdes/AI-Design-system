#!/usr/bin/env node
/* Red team: does the guardrail actually bite?
 *
 * Every other check in this repository asks "is this code right". None of them
 * asks "would we have noticed if it were wrong", and that question is the one
 * that decides whether the whole harness is real. A linter with a hole in it
 * reads exactly like a linter without one: green.
 *
 * So this takes the reference solutions — the fixtures that score 100% — breaks
 * each of them in a way an agent really breaks code, and fails if the break gets
 * through. The mutation list is not imagination: it is the failure classes that
 * were actually measured across 27 agent runs (evals/BASELINE.md) plus the two
 * the contract repeats most often.
 *
 * It runs offline, in about a second, against the same scorer `npm run verify`
 * and the MCP `verify` tool expose, so what it proves is exactly what an agent
 * gets told mid-flight.
 *
 *   npm run redteam            every mutation against every fixture that fits
 *   npm run redteam -- --list  what is being tried, and why
 *
 * A surviving mutation is a hole. Fix the scorer; never delete the mutation.
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { staticScore } from '../evals/scorers.mjs'

const ROOT = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const FIXTURES = `${ROOT}/evals/fixtures`
const RED = '\x1b[31m', GREEN = '\x1b[32m', DIM = '\x1b[2m', BOLD = '\x1b[1m', OFF = '\x1b[0m'

const registry = JSON.parse(readFileSync(`${ROOT}/component-registry.json`, 'utf8'))
const all = { ...registry.components, ...registry.blocks }

/* ── the material ────────────────────────────────────────────────────── */
function readDir(dir) {
  const files = {}
  for (const name of readdirSync(dir)) {
    const full = `${dir}/${name}`
    if (statSync(full).isDirectory() || !/\.(tsx?|css)$/.test(name)) continue
    files[name] = readFileSync(full, 'utf8')
  }
  return files
}

const clean = readdirSync(FIXTURES)
  .filter((id) => existsSync(`${FIXTURES}/${id}/good`))
  .map((id) => ({ id, files: readDir(`${FIXTURES}/${id}/good`) }))
  .filter((c) => Object.keys(c.files).length)

/* ── helpers the mutations share ─────────────────────────────────────── */
const tsxOf = (files) => Object.keys(files).find((n) => n.endsWith('.tsx'))
const cssOf = (files) => Object.keys(files).find((n) => n.endsWith('.css'))

/* Every reference solution here is a single .tsx, so the CSS rules would go
 * unexercised if a mutation needed a stylesheet to already exist. The case being
 * tested is a candidate that WRITES css, so the mutation writes one. */
function withCss(files, declaration) {
  const file = cssOf(files) ?? 'Screen.css'
  const before = files[file] ?? ''
  /* One declaration per line, the way CSS is actually written and the way the
   * scorer reads it. A rule folded onto one line hides the property behind the
   * selector, which would make this test pass for the wrong reason. */
  return { ...files, [file]: `${before}\n.redteam-probe {\n  ${declaration}\n}\n` }
}

/* The first opening tag the scorer is able to JUDGE, which is narrower than "a
 * tag the registry knows". A slot export (CardTitle) has no props of its own in
 * the registry, and a component that spreads native attributes (`inherits`)
 * legitimately accepts props no registry could list. Mutating one of those and
 * calling the silence a hole would be testing a case the scorer deliberately
 * does not judge, and the fix would be a scorer that cries wolf on className. */
function firstRegistryTag(src, { judgeable = false, inherits = false } = {}) {
  for (const m of src.matchAll(/<([A-Z][A-Za-z0-9]*)\b/g)) {
    const entry = all[m[1]]
    if (!entry) continue
    const isMain = m[1] === entry.main || m[1] === entry.ref
    /* `inherits: true` asks for the OPPOSITE of `judgeable`: a passthrough
       entry, which is exactly the population the prop check used to skip. */
    if (inherits && (!entry.inherits || !isMain)) continue
    if (judgeable && (entry.inherits || !isMain)) continue
    return { name: m[1], at: m.index }
  }
  return null
}

function enumPropOf(ref) {
  return (all[ref]?.props ?? []).find((p) => p.values?.length)
}

function requiredPropOf(ref) {
  return (all[ref]?.props ?? []).find((p) => p.required && p.type !== 'ReactNode')
}

/* ── the mutations ───────────────────────────────────────────────────── */
const MUTATIONS = [
  {
    name: 'invented-component',
    why: 'The failure this whole harness exists for: a component that sounds right and does not exist.',
    apply(files) {
      const file = tsxOf(files)
      const tag = file && firstRegistryTag(files[file])
      if (!tag) return null
      const fake = `${tag.name}Pro`
      const src = files[file]
        .replaceAll(`<${tag.name}`, `<${fake}`)
        .replaceAll(`</${tag.name}>`, `</${fake}>`)
      return { ...files, [file]: src }
    },
  },
  {
    /* The sibling case — an invented component WITH the import an agent writes
       for it — is not here on purpose. That hole lived in the MCP wrapper's
       exemption for the caller's own components, not in `staticScore`, so a
       mutation here would pass before and after the fix and read as coverage
       nobody has. Its guard is mcp/server.test.mjs (2026-08-26). */
    name: 'invented-prop-on-a-passthrough',
    why: 'An invented prop on a component that spreads ...rest. Those were 27 of 143 entries — Button, Card, Badge — and the prop check skipped them entirely until 2026-08-26.',
    apply(files) {
      const file = tsxOf(files)
      if (!file) return null
      const tag = firstRegistryTag(files[file], { inherits: true })
      if (!tag) return null
      const src = files[file].slice(0, tag.at + tag.name.length + 1) +
        ' padding="huge"' +
        files[file].slice(tag.at + tag.name.length + 1)
      return { ...files, [file]: src }
    },
  },
  {
    name: 'invented-prop',
    why: 'A prop that reads like it should exist. Measured on real runs more often than any other class.',
    apply(files) {
      const file = tsxOf(files)
      const tag = file && firstRegistryTag(files[file], { judgeable: true })
      if (!tag) return null
      const src = files[file].slice(0, tag.at + tag.name.length + 1) +
        ' density="compact"' +
        files[file].slice(tag.at + tag.name.length + 1)
      return { ...files, [file]: src }
    },
  },
  {
    name: 'value-outside-union',
    why: 'The prop is real, the value is not. A union the registry publishes is the thing an agent guesses at.',
    apply(files) {
      const file = tsxOf(files)
      const tag = file && firstRegistryTag(files[file], { judgeable: true })
      const prop = tag && enumPropOf(tag.name)
      if (!prop) return null
      const src = files[file].slice(0, tag.at + tag.name.length + 1) +
        ` ${prop.name}="notavalue"` +
        files[file].slice(tag.at + tag.name.length + 1)
      return { ...files, [file]: src }
    },
  },
  {
    name: 'missing-required-prop',
    why: 'Half a component. It compiles in JSX-land often enough to reach review.',
    apply(files) {
      const file = tsxOf(files)
      const tag = file && firstRegistryTag(files[file])
      const prop = tag && requiredPropOf(tag.name)
      if (!prop) return null
      /* Strip that prop from every occurrence of the tag. */
      const src = files[file].replace(
        new RegExp(`(<${tag.name}\\b[^>]*?)\\s${prop.name}=(\\{[^}]*\\}|"[^"]*")`, 'g'),
        '$1',
      )
      if (src === files[file]) return null
      return { ...files, [file]: src }
    },
  },
  {
    name: 'inline-style',
    why: 'The rule the contract states plainest and agents broke on three of nine tasks anyway.',
    apply(files) {
      const file = tsxOf(files)
      const tag = file && firstRegistryTag(files[file])
      if (!tag) return null
      const src = files[file].slice(0, tag.at + tag.name.length + 1) +
        ' style={{ padding: 12 }}' +
        files[file].slice(tag.at + tag.name.length + 1)
      return { ...files, [file]: src }
    },
  },
  {
    name: 'raw-hex',
    why: 'A colour decided in a component instead of taken from a semantic token.',
    apply(files) {
      return withCss(files, 'color: #3f7de0;')
    },
  },
  {
    name: 'raw-px-spacing',
    why: 'Spacing invented off the grid. The scale exists precisely so this is never a judgement call.',
    apply(files) {
      return withCss(files, 'padding: 18px;')
    },
  },
  {
    name: 'important',
    why: 'A specificity fight settled with a hammer. Always a symptom, never a fix.',
    apply(files) {
      return withCss(files, 'display: block !important;')
    },
  },
  {
    name: 'physical-property',
    why: 'padding-left in a system that ships Arabic. It looks right in one direction and wrong in the other.',
    apply(files) {
      return withCss(files, 'margin-left: 8px;')
    },
  },
]

if (process.argv.includes('--list')) {
  console.log(`${BOLD}What the red team tries${OFF}\n`)
  for (const m of MUTATIONS) console.log(`  ${m.name.padEnd(22)} ${DIM}${m.why}${OFF}`)
  process.exit(0)
}

/* ── run ─────────────────────────────────────────────────────────────── */
const score = (files) => {
  const { findings } = staticScore(files, { registry })
  return Object.entries(findings).filter(([, v]) => v.length)
}

console.log(`${BOLD}Red team${OFF} ${DIM}${MUTATIONS.length} mutations against ${clean.length} reference solutions${OFF}\n`)

const problems = []

/* The reference solutions must be clean first, or a "caught" verdict below could
 * be a pre-existing finding rather than the mutation. */
for (const c of clean) {
  const found = score(c.files)
  if (found.length) {
    problems.push(`fixture ${c.id}/good is not clean before any mutation: ${found.map(([d]) => d).join(', ')}`)
  }
}

for (const mutation of MUTATIONS) {
  const attempts = []
  for (const c of clean) {
    const mutated = mutation.apply(c.files)
    if (!mutated) continue
    const found = score(mutated)
    attempts.push({ fixture: c.id, caught: found.length > 0, dimensions: found.map(([d]) => d) })
  }

  if (!attempts.length) {
    problems.push(`${mutation.name} could not be applied to any fixture — the rule is unexercised, which is not the same as safe`)
    console.log(`  ${RED}✗${OFF} ${mutation.name.padEnd(22)} ${DIM}not applicable to any fixture${OFF}`)
    continue
  }

  const survived = attempts.filter((a) => !a.caught)
  const dims = [...new Set(attempts.flatMap((a) => a.dimensions))].join(', ')
  if (survived.length) {
    problems.push(`${mutation.name} survived in ${survived.map((s) => s.fixture).join(', ')}`)
    console.log(`  ${RED}✗${OFF} ${mutation.name.padEnd(22)} survived ${survived.length}/${attempts.length}  ${DIM}${mutation.why}${OFF}`)
  } else {
    console.log(`  ${GREEN}✓${OFF} ${mutation.name.padEnd(22)} caught ${attempts.length}/${attempts.length}  ${DIM}${dims}${OFF}`)
  }
}

console.log('')
if (problems.length) {
  console.error(`${RED}✗ the guardrail has ${problems.length} hole(s):${OFF}`)
  for (const p of problems) console.error(`    ${p}`)
  console.error(`\n  A mistake that survives here is a mistake that reaches a client. Fix the scorer, never the mutation.\n`)
  process.exit(1)
}
console.log(`${GREEN}✓ every mutation is caught by the check an agent can run on itself.${OFF}`)
