#!/usr/bin/env node
/**
 * Nothing client-identifying may sit in the tree that gets published.
 *
 * `scripts/publish-ds.mjs` snapshots this package to a public repository and
 * swaps the internal working log for a stub, because that log narrates client
 * projects. It was the only thing swapped, and the assumption underneath it —
 * that everything ELSE in the package is generic — had stopped being true:
 * one screen spec carried a client platform's own name and its field names, and `screen-specs/models/` is named after three real products
 * (2026-08-28, found while preparing to publish more of the system).
 *
 * A one-time clean-up does not hold. The package gains screen specs and content
 * models continuously, each written against a real product because that is the
 * only way to write one honestly, and a person deciding what is safe to publish
 * is a person who will one day be in a hurry. So the identifiers are declared
 * and the check runs in the gate, before the publish rather than after it.
 *
 * WHAT COUNTS. A client or product NAME, and a field name derived from one. Not
 * a domain word: "routing group" is how the software works and belongs in a
 * worked example, while the same field prefixed with the vendor's name says
 * whose software it is. The words themselves live in config/publishable.json,
 * which is the one file allowed to spell them.
 *
 *   npm run check:publishable
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const ROOT = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const RED = '\x1b[31m', GREEN = '\x1b[32m', DIM = '\x1b[2m', BOLD = '\x1b[1m', OFF = '\x1b[0m'

const config = JSON.parse(readFileSync(`${ROOT}/config/publishable.json`, 'utf8'))
const NAMES = config.identifiers.map((i) => ({ ...i, re: new RegExp(`\\b${i.word}`, 'i') }))
const ALLOW = new Set(config.allow ?? [])
/* What publish-ds.mjs drops before it pushes. Scanning the whole package meant
   reporting product specs that have never left the monorepo — a check that
   cries about files nobody publishes is a check somebody turns off. */
const NEVER = config.neverShips ?? []
const ships = (rel) => !NEVER.some((d) => (d.endsWith('/') ? rel.startsWith(d) : rel === d))

/* The working log is replaced by a stub on publish and is the one file allowed
   to narrate client work; everything else in the tree ships as it stands. */
/* `config/publishable.json` has to spell the words it forbids, and `coverage/`
   is a build artefact git does not carry. Everything else is in scope. */
const SKIP = /^(node_modules|dist|coverage|\.git|r\/|visual\/baseline|visual\/screens|public\/demo|docs\/CHANGELOG-REVIEW\.md|config\/publishable\.json|evals\/\.)/
const TEXT = /\.(md|json|ts|tsx|css|mjs|js|txt|html|yml|yaml)$/

const files = []
const walk = (dir, rel = '') => {
  for (const name of readdirSync(dir)) {
    const r = rel ? `${rel}/${name}` : name
    if (SKIP.test(r)) continue
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, r)
    else if (TEXT.test(name)) files.push(r)
  }
}
walk(ROOT)

const hits = []
for (const rel of files) {
  if (ALLOW.has(rel) || !ships(rel)) continue
  const src = readFileSync(`${ROOT}/${rel}`, 'utf8')
  for (const id of NAMES) {
    if (!id.re.test(src) && !id.re.test(rel)) continue
    const line = src.split('\n').findIndex((l) => id.re.test(l)) + 1
    hits.push({ rel, word: id.word, why: id.why, line: id.re.test(rel) ? 'in the FILE NAME' : `line ${line}` })
  }
}

console.log(`${BOLD}Publishable${OFF} ${DIM}${files.filter(ships).length} file(s) that would ship, ${NAMES.length} declared identifier(s)${OFF}`)

if (hits.length) {
  console.error(`\n${RED}✗ ${hits.length} client-identifying reference(s) in the published tree:${OFF}`)
  for (const h of hits) console.error(`    ${h.rel}  ${DIM}${h.line} — "${h.word}": ${h.why}${OFF}`)
  console.error(`\n  ${DIM}Rename it to the domain word, or record the file in config/publishable.json`)
  console.error(`  with the reason it is safe. This package is pushed to a public repository;`)
  console.error(`  a worked example is worth keeping and whose software it describes is not.${OFF}`)
  process.exit(1)
}
console.log(`${GREEN}✓ nothing in the published tree names a client or a client product.${OFF}`)
