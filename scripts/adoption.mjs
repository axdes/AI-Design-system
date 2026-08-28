#!/usr/bin/env node
/* How much of a product's UI is actually this system.
 *
 * Three things already watch the boundary between an app and the system, and
 * none of them answers this question. `scout` finds what was built twice.
 * `lint:rules` fails a raw <button> in a screen. Both are PASS/FAIL on specific
 * lines, which is right for a gate and useless for direction: an app can sit at
 * green all year while the share of its UI that comes from the system falls.
 *
 * The published `ds-usage-score` skill measures exactly this — for a Figma file.
 * Nothing measured the code.
 *
 * Two numbers per product, and the definitions are the whole design:
 *
 *   ADOPTION   of the elements this system HAS an answer for, how many took it.
 *              A raw <button> counts against an app that imports @ds/Button; a
 *              <div> does not count at all. Every app needs divs, and a metric
 *              that punishes them measures nothing and gets ignored — which is
 *              worse than not measuring.
 *
 *   TEMPLATES  how many screens are carried by a page template from @blocks
 *              rather than hand-rolled chrome. The scout already reports an
 *              unconsumed template as the inversion it is; this says how far
 *              that has got, per product, as a fraction of its screens.
 *
 * A product's own components are not counted against it either way. An app
 * component that wraps a system component and supplies the wiring IS the pattern
 * working, and the contract says so; whether one that does NOT wrap should be
 * promoted is `scout`'s question, asked with better evidence than a count.
 *
 *   npm run adoption            every product next to this checkout
 *   npm run adoption -- --json  the same as data, for a trend
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../../..', import.meta.url)).replace(/\/$/, '')
const DS = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const APPS = join(ROOT, 'apps')
const GREEN = '\x1b[32m', YELLOW = '\x1b[33m', RED = '\x1b[31m', DIM = '\x1b[2m', BOLD = '\x1b[1m', R = '\x1b[0m'

/* Apps carry their own git repositories and this package also ships as a
 * vendored snapshot inside one of their archives. Both are checkouts with no
 * `apps/` beside them, and there is nothing to measure there. Same reasoning as
 * promotion-scout.mjs, which is the other tool that reads across the boundary. */
if (!existsSync(APPS)) {
  console.log('adoption: no apps/ next to this checkout — nothing to measure.')
  process.exit(0)
}

const registry = JSON.parse(readFileSync(`${DS}/component-registry.json`, 'utf8'))
const systemNames = new Set([
  ...Object.keys(registry.components), ...Object.keys(registry.blocks),
  ...Object.values({ ...registry.components, ...registry.blocks }).flatMap((e) => e.exports ?? []),
])

/**
 * The HTML elements this system publishes a component for.
 *
 * Deliberately short, and every entry is checked against the registry below: a
 * map that names a component which has since been removed would quietly stop
 * counting a leak, which is the failure this whole file exists to prevent.
 *
 * What is NOT here matters more. div, span, p, section, header, nav, ul, li and
 * the rest are structural: the system's own components are built out of them,
 * every app needs them, and counting them as failures produces a number nobody
 * can act on. They are reported beside the score, never inside it.
 */
const COVERED = {
  button: 'Button',
  input: 'Input',
  select: 'Select',
  textarea: 'Textarea',
  table: 'Table',
  dialog: 'Modal',
  progress: 'Meter',
}
for (const [tag, name] of Object.entries(COVERED)) {
  if (!systemNames.has(name)) {
    console.error(`${RED}✗${R} adoption: the map says <${tag}> is covered by ${name}, and ${name} is not in the registry. Fix the map — a stale entry stops counting a real leak.`)
    process.exit(1)
  }
}

const TEMPLATE = /Template$/

/** Every .tsx under a directory, minus tests and golden examples. */
function sources(dir) {
  const out = []
  const walk = (d) => {
    let items
    try { items = readdirSync(d) } catch { return }
    for (const item of items) {
      if (item === 'node_modules' || item === 'dist' || item.startsWith('.')) continue
      const full = join(d, item)
      if (statSync(full).isDirectory()) walk(full)
      else if (/\.tsx$/.test(item) && !/\.(test|spec|example)\.tsx$/.test(item)) out.push(full)
    }
  }
  walk(dir)
  return out
}

/** Names this file imported from the design system, by any of its aliases. */
function systemImports(src) {
  const names = new Set()
  for (const m of src.matchAll(/import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['"](@ds|@blocks)\/[^'"]+['"]/g)) {
    for (const part of m[1].split(',')) {
      const name = part.trim().split(/\s+as\s+/).pop().trim()
      if (name) names.add(name)
    }
  }
  /* The default-ish form the apps also use: `import { X } from '@ds/X'` is above;
   * `import X from '@ds/X'` appears in the vendored copies. */
  for (const m of src.matchAll(/import\s+([A-Z][A-Za-z0-9]*)\s+from\s+['"](@ds|@blocks)\/[^'"]+['"]/g)) names.add(m[1])
  return names
}

/* Comments and string literals are stripped before counting: a `<button>` inside
 * a comment explaining why NOT to write one would otherwise be counted as one. */
const strip = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(^|[^:])\/\/[^\n]*/g, '$1')
  .replace(/(['"])(?:\\.|(?!\1)[^\\\n])*\1/g, '""')

function measure(app) {
  const dir = join(APPS, app, 'src')
  if (!existsSync(dir)) return null
  const files = sources(dir)
  if (!files.length) return null

  let system = 0, covered = 0, structural = 0, local = 0
  const leaks = new Map()
  const used = new Set()
  let screens = 0, templated = 0

  for (const file of files) {
    const raw = readFileSync(file, 'utf8')
    const imported = systemImports(raw)
    const src = strip(raw)
    /* A screen is a file the app itself files under layouts/ or pages/. Both
     * names are in use across the products and neither is this package's to
     * rename. */
    const isScreen = /\/(layouts|pages)\//.test(file)
    if (isScreen) {
      screens++
      if ([...imported].some((n) => TEMPLATE.test(n) && src.includes(`<${n}`))) templated++
    }
    for (const m of src.matchAll(/<([A-Za-z][A-Za-z0-9.]*)[\s/>]/g)) {
      const tag = m[1]
      const root = tag.split('.')[0]
      if (/^[a-z]/.test(tag)) {
        if (COVERED[tag]) {
          covered++
          leaks.set(tag, (leaks.get(tag) ?? 0) + 1)
        } else structural++
      } else if (imported.has(root)) {
        system++
        used.add(root)
      } else local++
    }
  }

  const answerable = system + covered
  return {
    app,
    files: files.length,
    system, covered, structural, local,
    adoption: answerable ? system / answerable : null,
    distinct: used.size,
    screens, templated,
    templates: screens ? templated / screens : null,
    leaks: [...leaks].sort((a, b) => b[1] - a[1]),
  }
}

const apps = readdirSync(APPS)
  .filter((a) => existsSync(join(APPS, a, 'package.json')))
  .sort()
const rows = apps.map(measure).filter(Boolean)

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ rows }, null, 2))
  process.exit(0)
}

/* ── the floor ─────────────────────────────────────────────────────────── */

/* The recorded floors are DATA about the products, so they live with the
 * products at the monorepo root and not in this package. Same rule as
 * promotion-scout.mjs states for its decisions: a published design system that
 * listed its owner's projects would be telling the world what they build.
 *
 * A floor can only be RAISED, which is the same contract the coverage floor runs
 * on. A product may sit at 10% templated for as long as it takes; what it may
 * not do is reach 40% and quietly go back. */
const FLOORS = `${ROOT}/scripts/adoption.floors.json`
const floorOf = (r) => ({ adoption: Math.floor((r.adoption ?? 0) * 100), templates: Math.floor((r.templates ?? 0) * 100) })

if (process.argv.includes('--record')) {
  const next = Object.fromEntries(rows.map((r) => [r.app, floorOf(r)]))
  const held = existsSync(FLOORS) ? JSON.parse(readFileSync(FLOORS, 'utf8')).floors ?? {} : {}
  for (const [app, was] of Object.entries(held)) {
    if (!next[app]) { next[app] = was; continue }
    /* Recording never lowers anything. A run on a machine where one product is
     * mid-refactor would otherwise write that dip in as the new floor. */
    next[app] = { adoption: Math.max(next[app].adoption, was.adoption), templates: Math.max(next[app].templates, was.templates) }
  }
  writeFileSync(FLOORS, JSON.stringify({
    _why: 'Floors for npm run check:adoption, recorded by npm run adoption -- --record. They only go up: a product may take as long as it likes to climb, and may not slide back. Percentages, floored.',
    floors: Object.fromEntries(Object.entries(next).sort()),
  }, null, 2) + '\n')
  console.log(`${GREEN}✓${R} recorded ${Object.keys(next).length} floor(s) in scripts/adoption.floors.json`)
  process.exit(0)
}

if (process.argv.includes('--check')) {
  if (!existsSync(FLOORS)) {
    console.log(`adoption: no floors recorded yet. ${DIM}Run npm run adoption -- --record once, and commit the file.${R}`)
    process.exit(0)
  }
  const held = JSON.parse(readFileSync(FLOORS, 'utf8')).floors ?? {}
  const fallen = []
  for (const r of rows) {
    const floor = held[r.app]
    if (!floor) continue
    const now = floorOf(r)
    if (now.adoption < floor.adoption) fallen.push(`${r.app}: adoption ${now.adoption}% is below its floor of ${floor.adoption}% — ${r.leaks.map(([t, n]) => `<${t}> x${n}`).join(', ') || 'no raw controls, so a system part was replaced by a local one'}`)
    if (now.templates < floor.templates) fallen.push(`${r.app}: ${now.templates}% of screens on a template, below its floor of ${floor.templates}% — a screen stopped using one, or a hand-rolled screen was added`)
  }
  if (fallen.length) {
    console.error(`\n${RED}✗ adoption${R}\n`)
    for (const f of fallen) console.error(`  ${RED}✗${R} ${f}`)
    console.error(`\n  ${DIM}Fix the screen, or raise nothing: a floor is not lowered to clear red. If the`)
    console.error(`  drop is deliberate, say so in the commit and re-record with a written reason.${R}\n`)
    process.exit(1)
  }
  console.log(`${GREEN}✓${R} adoption: ${rows.length} product(s), none below its recorded floor.`)
  process.exit(0)
}

/* FLOORED, not rounded. 2323 of 2326 is 99.87%, and printing that as 100% tells
 * a product with three raw buttons in it that it has none. A number that rounds
 * its own exceptions away is not a measurement. */
const pct = (n) => (n === null ? '   —' : `${Math.floor(n * 100)}%`.padStart(4))
const tone = (n) => (n === null ? DIM : n >= 0.9 ? GREEN : n >= 0.7 ? YELLOW : RED)

console.log(`\n${BOLD}Design system adoption${R} ${DIM}${rows.length} product(s)${R}\n`)
console.log(`  ${DIM}product        adoption   screens on a template   system parts used   raw controls left${R}`)
for (const r of rows) {
  console.log(
    `  ${r.app.padEnd(14)}${tone(r.adoption)}${pct(r.adoption)}${R}   ` +
    `${tone(r.templates)}${pct(r.templates)}${R} ${DIM}(${r.templated}/${r.screens})${R}`.padEnd(38) +
    `${String(r.distinct).padStart(8)}   ` +
    `${DIM}${r.leaks.length ? r.leaks.map(([t, n]) => `${t}×${n}`).join(' ') : 'none'}${R}`,
  )
}

const system = rows.reduce((n, r) => n + r.system, 0)
const covered = rows.reduce((n, r) => n + r.covered, 0)
const structural = rows.reduce((n, r) => n + r.structural, 0)
const localTotal = rows.reduce((n, r) => n + r.local, 0)
console.log(`\n  ${BOLD}Across every product${R}: ${tone(system / (system + covered))}${Math.floor((system / (system + covered)) * 100)}%${R} of the elements this system answers came from it ${DIM}(${system} system, ${covered} raw)${R}`)
console.log(`  ${DIM}Not counted: ${structural} structural elements (div, span, section — every app needs them) and`)
console.log(`  ${localTotal} of the products' own components, which are scout's question, not this one.${R}\n`)
