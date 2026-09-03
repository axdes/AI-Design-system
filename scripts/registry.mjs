#!/usr/bin/env node
/* registry — read the component contract one component at a time.
 *
 * component-registry.json is the full contract and it costs about 41k tokens.
 * An agent used to pay that on every task, for 82 components, in order to use
 * four of them. Discovery now reads component-index.md (about 2.4k: every
 * component, one line each) and asks this command for the detail of the ones it
 * is actually going to write. Same generated source, two granularities.
 *
 * Usage:
 *   npm run registry                      the index, as text (what exists)
 *   npm run registry -- Button Card       the full entry for those components
 *   npm run registry -- --dense Modal     props and variants only, no example
 *   npm run registry -- --search table    everything whose name or line matches
 *   npm run registry -- --tokens space    the token catalogue, filtered
 *   npm run registry -- --json Button     the raw entry, for tooling
 *
 * A name that does not exist is answered with the nearest ones that do, because
 * the failure mode this whole harness exists to prevent is an agent inventing a
 * component rather than looking for the real one.
 */
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { indexRow, renderRow } from './lib/index-rows.mjs'

const ROOT = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const B = '\x1b[1m', D = '\x1b[2m', R = '\x1b[0m', RED = '\x1b[31m'

const argv = process.argv.slice(2)
const flag = (name) => argv.includes(`--${name}`)
const valueOf = (name) => {
  const i = argv.indexOf(`--${name}`)
  return i === -1 ? null : argv[i + 1] ?? ''
}
const names = argv.filter((a, i) => {
  if (a.startsWith('--')) return false
  const prev = argv[i - 1]
  return !(prev === '--search' || prev === '--tokens')
})

const registryPath = `${ROOT}/component-registry.json`
if (!existsSync(registryPath)) {
  console.error(`${RED}✗ the registry is not generated. Run \`npm run gen-registry\`.${R}`)
  process.exit(1)
}
const registry = JSON.parse(readFileSync(registryPath, 'utf8'))
const all = { ...registry.components, ...registry.blocks }
/* Behaviour answers the same question as a part and is asked for the same way.
 * A search that knew only components is how somebody looks for "the hook that
 * anchors a layer", finds nothing, and writes a fourth one. (2026-09-03) */
const mechanisms = registry.mechanisms ?? {}
/* The rows are BUILT here rather than parsed out of component-index.md: that
 * file is a rendering for an agent to read, and a tool that parses a rendering
 * is a tool that breaks when the rendering improves. One builder, same rows. */
const rows = Object.values(all).map(indexRow)

/* ── the index, as text ──────────────────────────────────────────────── */
function printIndex(list = rows) {
  for (const r of list) console.log(`  ${renderRow(r)}`)
  console.log(`\n  ${D}${list.length} entries. Detail for the ones you will use: npm run registry -- <Name> [<Name>…]${R}`)
}

/* ── one entry, in full ──────────────────────────────────────────────── */
function printEntry(ref, entry, { dense }) {
  console.log(`\n${B}${ref}${R} ${D}${[entry.level, entry.context ?? 'card', entry.status].filter(Boolean).join(' · ')}${R}`)
  console.log(`  ${entry.description}`)
  if (entry.from) {
    const app = entry.from.replace('@/components/', '@ds/').replace('@/blocks/', '@blocks/')
    console.log(`  ${B}import${R} from '${entry.from}'  ${D}(from an app: '${app}')${R}`)
  }
  console.log(`  ${D}${entry.sourcePath}${R}`)

  const parts = (entry.exports ?? []).filter((n) => n !== entry.main)
  if (parts.length) console.log(`\n  ${B}parts${R} ${parts.join(', ')}`)

  if (entry.props?.length) {
    console.log(`\n  ${B}props${R}`)
    for (const p of entry.props) {
      const req = p.required ? ' (required)' : ''
      const values = p.values?.length ? `  ${D}one of: ${p.values.join(' | ')}${R}` : ''
      console.log(`    ${p.name}${req}: ${p.type}${values}`)
      if (p.description && !dense) console.log(`      ${D}${p.description}${R}`)
    }
  }

  if (entry.variants && Object.keys(entry.variants).length) {
    console.log(`\n  ${B}variants${R} ${D}(data-* the CSS actually styles)${R}`)
    for (const [attr, v] of Object.entries(entry.variants)) {
      const values = Array.isArray(v) ? v : (v.values ?? Object.values(v).flat())
      console.log(`    data-${attr}: ${[...new Set(values)].join(' | ')}`)
    }
  }

  if (entry.uses?.length) console.log(`\n  ${B}composes${R} ${entry.uses.join(', ')}`)

  if (entry.example && !dense) {
    console.log(`\n  ${B}golden example${R} ${D}(real, compiled and rendered by the test suite)${R}`)
    for (const line of entry.example.split('\n')) console.log(`    ${line}`)
  }
}

/* ── a name that does not exist ──────────────────────────────────────── */
function bigrams(s) {
  const out = new Set()
  for (let i = 0; i < s.length - 1; i++) out.add(s.slice(i, i + 2))
  return out
}

/* Dice coefficient over letter pairs, plus a bonus for a shared substring. Plain
 * letter-overlap answered "DataTable" with "CommandPalette"; an agent that asked
 * for a data table needs to be shown DataGrid and Table or it will build one. */
function nearest(name) {
  const q = name.toLowerCase()
  const qb = bigrams(q)
  const score = (ref) => {
    const r = ref.toLowerCase()
    const rb = bigrams(r)
    let shared = 0
    for (const g of qb) if (rb.has(g)) shared++
    const dice = (2 * shared) / (qb.size + rb.size || 1)
    const contains = r.includes(q) || q.includes(r) ? 0.5 : 0
    return dice + contains
  }
  return Object.keys(all)
    .map((ref) => [ref, score(ref)])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([ref]) => ref)
}

/* ── run ─────────────────────────────────────────────────────────────── */
if (flag('tokens')) {
  const filter = (valueOf('tokens') ?? '').toLowerCase()
  const tokens = Array.isArray(registry.tokens) ? registry.tokens : Object.values(registry.tokens ?? {})
  const hits = tokens.filter((t) => !filter || filter.startsWith('--') || JSON.stringify(t).toLowerCase().includes(filter))
  console.log(`${B}tokens${R} ${D}${hits.length} of ${tokens.length}${R}\n`)
  for (const t of hits) {
    const name = t.name ?? t.token ?? String(t)
    console.log(`  ${name.padEnd(28)} ${D}${t.value ?? ''}${t.description ? `  ${t.description}` : ''}${R}`)
  }
  process.exit(0)
}

if (flag('search')) {
  const q = (valueOf('search') ?? '').toLowerCase()
  /* Search is discovery, so it answers with what may be PICKED: an `@internal`
     part is rendered by whatever owns it and is reachable by its exact name
     (below) rather than by browsing. */
  const hits = rows
    .filter((r) => r.status !== 'internal')
    .filter((r) => r.ref.toLowerCase().includes(q) || r.use.toLowerCase().includes(q))
  const behaviour = Object.values(mechanisms)
    .filter((m) => m.ref.toLowerCase().includes(q) || (m.description ?? '').toLowerCase().includes(q))
  if (!hits.length && !behaviour.length) {
    console.log(`  ${D}nothing matches "${q}". The whole list is \`npm run registry\`.${R}`)
    process.exit(0)
  }
  if (hits.length) printIndex(hits)
  if (behaviour.length) {
    console.log(`\n${B}Behaviour${R} ${D}import from @/lib/<name> here, @lib/<name> from an app${R}`)
    for (const m of behaviour) console.log(`  ${m.ref} ${D}· ${m.description}${R}`)
  }
  process.exit(0)
}

if (!names.length) {
  const tokenCount = Array.isArray(registry.tokens) ? registry.tokens.length : Object.keys(registry.tokens ?? {}).length
  console.log(`${B}Design system${R} ${D}${Object.keys(registry.components).length} components, ${Object.keys(registry.blocks).length} blocks, ${tokenCount} tokens${R}\n`)
  printIndex()
  process.exit(0)
}

const missing = names.filter((n) => !all[n])
if (missing.length) {
  for (const n of missing) {
    console.error(`${RED}✗ ${n} is not in the registry.${R} Nearest: ${nearest(n).join(', ')}`)
  }
  console.error(`\n  ${D}If nothing here covers the need, file a request in requests/ and stop. Do not hand-roll it.${R}`)
  process.exit(1)
}

if (flag('json')) {
  console.log(JSON.stringify(Object.fromEntries(names.map((n) => [n, all[n]])), null, 2))
  process.exit(0)
}

for (const n of names) printEntry(n, all[n], { dense: flag('dense') })
console.log('')
