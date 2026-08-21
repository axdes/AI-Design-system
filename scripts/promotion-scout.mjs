// Promotion scout: what belongs in the design system but is sitting in an app.
//
// The whole point of a shared system is that a thing built once is available
// everywhere. The failure mode is quiet: someone needs a pill, a page skeleton,
// a provider, builds it inside their app because that is the shortest path, and
// the next app builds it again. Nothing is red, nothing is broken, and the
// system slowly stops being the place where components live.
//
// Nothing off the shelf catches that. `jscpd` sees copy-paste but not intent;
// `knip` sees dead code but not code that should have been shared. So this asks
// three questions the other tools cannot:
//
//   1. DUPLICATED — the same code exists in two packages. Evidence, not taste:
//      if it was worth copying it was worth promoting.
//   2. PARALLEL — the same component name exists in two or more apps and NEITHER
//      copy delegates to the design system. Two teams solved one problem twice.
//   3. UNCONSUMED — a design-system block or shell part that no app imports.
//      Reported, never failed: a library may ship ahead of demand. But a
//      template nobody uses while apps hand-roll page chrome is the exact
//      inversion this scout exists to surface, so it stays visible.
//
// Same discipline as the linter and the audit gate: every known finding needs a
// written reason and a condition that ends it. Anything unrecorded fails.
// Shrink ACCEPTED; never widen it to clear red.
//
// Run: node scripts/promotion-scout.mjs [--fast]   (--fast skips the clone scan)
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../../..', import.meta.url)).replace(/\/$/, '')
const APPS = join(ROOT, 'apps')
const DS = join(ROOT, 'packages/design-system')

/* Apps carry their own git repositories and the design system also ships as a
 * vendored snapshot inside an app's archive. Both are checkouts with no `apps/`
 * next to them, and there is nothing cross-package to compare there. */
if (!existsSync(APPS)) {
  console.log('promotion-scout: no apps/ next to this checkout — nothing to compare.')
  process.exit(0)
}

/* The recorded decisions are DATA and they live with the products they name, at
 * the monorepo root. This file is the scanner: it reads which products exist
 * from the folder and knows none of them by name. A published design system
 * that listed its owner's projects would be telling the world what they build. */
const DECISIONS = `${ROOT}/scripts/scout.decisions.mjs`
const { ACCEPTED, ACCEPTED_PARALLEL } = existsSync(DECISIONS)
  ? await import(DECISIONS)
  : { ACCEPTED: {}, ACCEPTED_PARALLEL: {} }


const RED = '\x1b[31m', GREEN = '\x1b[32m', YELLOW = '\x1b[33m', DIM = '\x1b[2m', B = '\x1b[1m', OFF = '\x1b[0m'
const failures = []

const appNames = readdirSync(APPS, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join(APPS, d.name, 'src')))
  .map((d) => d.name)

// ── 1. DUPLICATED ────────────────────────────────────────────────────────────
if (!process.argv.includes('--fast')) {
  const out = mkdtempSync(join(tmpdir(), 'scout-'))
  try {
    const targets = [join(DS, 'src'), ...appNames.map((a) => join(APPS, a, 'src'))]
    execFileSync(
      join(ROOT, 'node_modules/.bin/jscpd'),
      ['--min-tokens', '60', '--absolute', '--reporters', 'json', '--output', out, '--silent',
        '--pattern', '**/*.{ts,tsx,css}', ...targets],
      { stdio: 'ignore' },
    )
  } catch {
    /* jscpd exits non-zero when it finds clones; the report is written either way. */
  }

  const reportPath = join(out, 'jscpd-report.json')
  if (!existsSync(reportPath)) {
    console.error(`${RED}✗ jscpd produced no report${OFF}`)
    process.exit(1)
  }
  const report = JSON.parse(readFileSync(reportPath, 'utf8'))
  rmSync(out, { recursive: true, force: true })

  /* Package + layer, because "an app copied a layout" and "an app copied a
   * provider" are different decisions and deserve separate reasons. */
  const pkgOf = (p) => (p.match(/apps\/([a-z-]+)\//)?.[1] ?? (p.includes('packages/design-system') ? 'design-system' : '?'))
  const layerOf = (p) => (p.split('/src/')[1] ?? '').split('/')[0].replace(/\.[^.]+$/, '') || 'src'

  const groups = new Map()
  for (const d of report.duplicates ?? []) {
    const a = pkgOf(d.firstFile.name), b = pkgOf(d.secondFile.name)
    if (a === b) continue
    const key = `${[a, b].sort().join('↔')}:${layerOf(d.firstFile.name)}`
    const g = groups.get(key) ?? { lines: 0, count: 0, sample: '' }
    g.lines += d.lines; g.count += 1
    if (!g.sample) g.sample = d.firstFile.name.split('/src/')[1]
    groups.set(key, g)
  }

  console.log(`${B}Duplicated across packages${OFF}\n`)
  const sorted = [...groups].sort((x, y) => y[1].lines - x[1].lines)
  for (const [key, g] of sorted) {
    const e = ACCEPTED[key]
    const head = `${String(g.lines).padStart(5)} lines / ${String(g.count).padStart(2)} clones  ${key}`
    if (!e) { console.log(`  ${RED}✗ ${head} — NEW, no decision recorded${OFF}`); failures.push(key); continue }
    console.log(`  ${GREEN}✓${OFF} ${head}  ${DIM}${e.why.slice(0, 74)}…${OFF}`)
  }
  const stale = Object.keys(ACCEPTED).filter((k) => !groups.has(k))
  if (stale.length) {
    console.log(`\n  ${YELLOW}! ${stale.length} accepted group(s) no longer duplicated: ${stale.join(', ')}${OFF}`)
    console.log(`    Delete them — a stale exception hides the next real one.`)
  }
}

// ── 2. PARALLEL ──────────────────────────────────────────────────────────────
/* A copy that delegates is not a copy. An app's own `components/UserMenu` importing
 * `@ds/UserMenu` is the pattern working: the app owns the wiring (who the user
 * is, where entries navigate) and the system owns the look. Only a component
 * that reaches for nothing shared is a second implementation. */
const DELEGATES = /from\s+['"]@(ds|blocks|shell)\//

const owners = new Map()
for (const app of appNames) {
  const dir = join(APPS, app, 'src/components')
  if (!existsSync(dir)) continue
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const name = entry.name.replace(/\.tsx$/, '')
    const file = entry.isDirectory() ? join(dir, name, `${name}.tsx`) : join(dir, entry.name)
    if (!entry.name.endsWith('.tsx') && !existsSync(file)) continue
    const src = existsSync(file) ? readFileSync(file, 'utf8') : ''
    if (DELEGATES.test(src)) continue
    owners.set(name, [...(owners.get(name) ?? []), app])
  }
}

console.log(`\n${B}Built twice, shared nowhere${OFF}\n`)
const parallel = [...owners].filter(([, apps]) => apps.length > 1)
if (!parallel.length) console.log(`  ${GREEN}✓${OFF} no component name is implemented independently in two apps`)
for (const [name, apps] of parallel) {
  const e = ACCEPTED_PARALLEL[name]
  if (!e) { console.log(`  ${RED}✗ ${name} — built in ${apps.join(', ')} with no shared base${OFF}`); failures.push(name); continue }
  console.log(`  ${GREEN}✓${OFF} ${name} (${apps.join(', ')}) — ${DIM}${e.why.slice(0, 80)}${OFF}`)
}

// ── 3. UNCONSUMED ────────────────────────────────────────────────────────────
/* Never a failure. A design system is allowed to ship a component before the
 * first product needs it. But a page template sitting unused while apps
 * hand-roll page chrome is worth reading every time the gate runs. */
const appSrc = appNames.flatMap((a) => walk(join(APPS, a, 'src')))
  .filter((f) => /\.(ts|tsx)$/.test(f))
  .map((f) => readFileSync(f, 'utf8'))
  .join('\n')

console.log(`\n${B}In the system, used by no app${OFF}\n`)
for (const layer of ['blocks', 'shell']) {
  const dir = join(DS, 'src', layer)
  if (!existsSync(dir)) continue
  const unused = readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((n) => !appSrc.includes(`@${layer}/${n}`) && !appSrc.includes(`@${layer === 'blocks' ? 'blocks' : 'shell'}/${n}'`))
  const used = readdirSync(dir).filter((n) => !n.startsWith('.')).length
  console.log(`  ${layer}: ${used - unused.length}/${used} consumed` + (unused.length ? ` ${YELLOW}— idle: ${unused.join(', ')}${OFF}` : ` ${GREEN}✓${OFF}`))
}

function walk(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? walk(join(dir, d.name)) : [join(dir, d.name)])
}

if (failures.length) {
  console.error(`\n${RED}✗ ${failures.length} finding(s) with no recorded decision: ${failures.join(', ')}${OFF}`)
  console.error('  Promote it into the system, or add an entry with a reason and a recheck condition.')
  process.exit(1)
}
console.log(`\n${GREEN}✓ every cross-package copy has a written decision.${OFF}`)
