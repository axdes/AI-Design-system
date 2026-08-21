#!/usr/bin/env node
/* The import graph, resolved for real — the second opinion on architecture.
 *
 * `lint:rules` already checks atomic direction by reading import lines, and on
 * today's codebase the two agree exactly (measured 2026-08-19: 510 modules, 958
 * edges, zero findings from either). This step exists for the code that is not
 * written yet: a `React.lazy(() => import(...))`, a re-export chain, an alias a
 * text scan cannot follow — the shapes agents reach for as the system grows,
 * and precisely where a line-based linter goes blind. dependency-cruiser
 * resolves tsconfig aliases and walks the real graph, the same reason
 * `typecheck:next` runs a second compiler over the same code.
 *
 * Two failure classes, both from one cruise:
 *   1. imports against the dependency direction — atom → molecule → organism
 *      inside components (ranked by levels.json), components → blocks → shell
 *      → layouts across areas (each may reach down, never up; lib/data/locales
 *      are reachable from anywhere);
 *   2. cycles. Nothing else in the gate looks for them, and the first one
 *      announces itself as an undefined import that depends on load order.
 *
 * Tests and golden examples are consumers, not the system: excluded.
 * DS_LINT_ROOT points the cruise at a copy (linters.test.mjs); the alias map is
 * taken from THIS package's tsconfig either way, synthesised next to whatever
 * root is being read, so the copy needs no tsconfig of its own.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const PKG = dirname(dirname(fileURLToPath(import.meta.url)))
const ROOT = resolve(process.env.DS_LINT_ROOT || PKG)

const BIN = [
  join(PKG, '../../node_modules/.bin/depcruise'),
  join(PKG, 'node_modules/.bin/depcruise'),
].find(existsSync)
if (!BIN) {
  console.error('lint-graph: dependency-cruiser is not installed (expected in the workspace root node_modules)')
  process.exit(1)
}

/* The real tsconfig extends ../../tsconfig.base.json, which a copied tree does
 * not carry; the only thing the cruise needs from it is the alias map. */
const paths = JSON.parse(readFileSync(join(PKG, 'tsconfig.json'), 'utf8')).compilerOptions?.paths ?? {}
const TSCONFIG = join(ROOT, '.lint-graph.tsconfig.json')
writeFileSync(TSCONFIG, JSON.stringify({ compilerOptions: { baseUrl: '.', paths } }))

let graph
try {
  graph = JSON.parse(execFileSync(BIN, [
    'src', '--no-config', '--ts-config', '.lint-graph.tsconfig.json', '--output-type', 'json',
  ], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }))
} finally {
  rmSync(TSCONFIG, { force: true })
}

const levels = JSON.parse(readFileSync(join(ROOT, 'src/components/levels.json'), 'utf8'))
const RANK = { atom: 0, molecule: 1, organism: 2 }
/* Areas each may import from: themselves, anything listed, and the shared
 * ground (lib, data, locales, test harness types) which carries no level. */
const AREA_RANK = { components: 0, blocks: 1, shell: 2, layouts: 3 }

const skip = (p) => p.includes('.test.') || p.includes('.example.') || p.startsWith('src/test/')
const area = (p) => AREA_RANK[p.split('/')[1]] !== undefined && !skip(p) ? p.split('/')[1] : null
const component = (p) => /^src\/components\/([^/]+)\//.exec(p)?.[1] ?? null

const edges = new Map()
for (const m of graph.modules) {
  if (!m.source.startsWith('src/') || skip(m.source)) continue
  edges.set(m.source, m.dependencies.map((d) => d.resolved).filter((t) => t.startsWith('src/') && !skip(t)))
}

const direction = []
for (const [from, tos] of edges) {
  const fromArea = area(from)
  if (fromArea === null) continue
  for (const to of tos) {
    const toArea = area(to)
    if (toArea === null) continue
    if (AREA_RANK[toArea] > AREA_RANK[fromArea]) {
      direction.push(`${from}  imports UP the layer ladder: ${fromArea} may not reach ${toArea} (${to})`)
      continue
    }
    if (fromArea !== 'components' || toArea !== 'components') continue
    const a = component(from), b = component(to)
    if (!a || !b || a === b) continue
    if ((RANK[levels[b]] ?? -1) > (RANK[levels[a]] ?? 9)) {
      direction.push(`${from}  ${levels[a]} imports ${levels[b]}: ${to}`)
    }
  }
}

/* Tarjan, iteratively: a cycle is a strongly connected component of size > 1,
 * or a module that imports itself. */
const idx = new Map(), low = new Map(), on = new Set(), stack = []
const cycles = []
let counter = 0
for (const start of edges.keys()) {
  if (idx.has(start)) continue
  const work = [[start, 0]]
  while (work.length) {
    const frame = work[work.length - 1]
    const [v] = frame
    if (frame[1] === 0) { idx.set(v, counter); low.set(v, counter); counter++; stack.push(v); on.add(v) }
    const deps = edges.get(v) ?? []
    let advanced = false
    while (frame[1] < deps.length) {
      const w = deps[frame[1]++]
      if (!edges.has(w)) continue
      if (!idx.has(w)) { work.push([w, 0]); advanced = true; break }
      if (on.has(w)) low.set(v, Math.min(low.get(v), idx.get(w)))
    }
    if (advanced) continue
    if (low.get(v) === idx.get(v)) {
      const scc = []
      for (;;) { const w = stack.pop(); on.delete(w); scc.push(w); if (w === v) break }
      if (scc.length > 1) cycles.push(scc.reverse())
    }
    work.pop()
    if (work.length) {
      const [p] = work[work.length - 1]
      low.set(p, Math.min(low.get(p), low.get(v)))
    }
  }
}
for (const [from, tos] of edges) if (tos.includes(from)) cycles.push([from, from])

const modules = edges.size
const edgeCount = [...edges.values()].reduce((n, t) => n + t.length, 0)
console.log(`lint-graph — ${modules} modules, ${edgeCount} edges, resolved by dependency-cruiser`)

if (!direction.length && !cycles.length) {
  console.log('  ✓ every import runs down the ladder, and the graph has no cycles')
  process.exit(0)
}
for (const v of direction) console.error(`  ✗ ${v}`)
for (const c of cycles) console.error(`  ✗ cycle: ${c.join(' -> ')} -> ${c[0]}`)
console.error(`✗ ${direction.length + cycles.length} graph violation(s).`)
process.exit(1)
