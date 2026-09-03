#!/usr/bin/env node
/* What does this change touch — BEFORE the gate rather than after.
 *
 * The largest single cost measured in a day of working on this system: nothing
 * could say what a change affected, so every cycle was the whole gate. Changing
 * the focus ring meant running everything to discover that a hundred baselines
 * had moved; changing one component meant the same six minutes as changing the
 * token layer.
 *
 * Three questions, all answered from the code rather than from a table, because
 * a hand-written map of "what touches what" is exactly the population mistake
 * the gate steps now have to declare against:
 *
 *   1. which components did you change, and which baselines carry them
 *   2. which tokens did you change, and which components read them
 *   3. is anything generated now stale
 *
 *   npm run impact              uncommitted changes
 *   npm run impact -- <ref>     against a commit
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, basename } from 'node:path'

const ROOT = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const RESET = '\x1b[0m', GREEN = '\x1b[32m', DIM = '\x1b[2m', BOLD = '\x1b[1m', YEL = '\x1b[33m'
const ref = process.argv[2]

const git = (args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim()
const changed = git(ref ? ['diff', '--name-only', ref, '--', '.'] : ['status', '--porcelain', '.'])
  .split('\n')
  .map((l) => (ref ? l : l.slice(3)))
  .filter(Boolean)
  .map((p) => (p.startsWith('packages/design-system/') ? p.slice('packages/design-system/'.length) : p))

if (!changed.length) {
  console.log(`${DIM}nothing changed here${RESET}`)
  process.exit(0)
}

const walk = (dir, ext, out = []) => {
  if (!existsSync(dir)) return out
  for (const e of readdirSync(dir)) {
    const p = join(dir, e)
    if (statSync(p).isDirectory()) { if (!/node_modules|dist/.test(p)) walk(p, ext, out) }
    else if (p.endsWith(ext)) out.push(p)
  }
  return out
}

/* 1 — components, and the baselines that carry them. A baseline is named after
   the example it shot, so the link is the name and not a list. */
const parts = new Set()
for (const f of changed) {
  const m = /^src\/(?:components|blocks|shell)\/([A-Za-z0-9]+)\//.exec(f)
  if (m) parts.add(m[1])
}
const baselines = existsSync(`${ROOT}/visual/baseline`)
  ? readdirSync(`${ROOT}/visual/baseline`).filter((f) => [...parts].some((p) => f.startsWith(`${p}.`) || f.startsWith(`${p}-`)))
  : []

/* 2 — tokens, and who reads them. Both halves derived from the CSS. */
const touchedTokens = new Set()
for (const f of changed.filter((f) => f.startsWith('styles/') && f.endsWith('.css'))) {
  if (!existsSync(join(ROOT, f))) continue
  for (const m of readFileSync(join(ROOT, f), 'utf8').matchAll(/(--[a-zA-Z0-9-]+)\s*:/g)) touchedTokens.add(m[1])
}
const readers = new Map()
if (touchedTokens.size) {
  /* The same population lint:token-layer uses, or the two disagree and the
     report is the one people stop trusting: the layer itself reads its own
     tokens (a role is written in primitives), and the showcase is the system
     describing itself. */
  for (const f of [...walk(join(ROOT, 'src'), '.css'), ...walk(join(ROOT, 'styles'), '.css'), ...walk(join(ROOT, '../../apps/showcase/src'), '.css')]) {
    const css = readFileSync(f, 'utf8')
    for (const t of touchedTokens) {
      if (!css.includes(`var(${t})`)) continue
      if (f.startsWith(join(ROOT, 'styles')) && css.includes(`${t}:`)) continue
      if (!readers.has(t)) readers.set(t, new Set())
      readers.get(t).add(basename(f, '.css'))
    }
  }
}

/* 3 — what is generated FROM what changed. The generators know; asking them in
   --check mode is cheaper than a table of who writes what. */
const generators = [
  ['gen-registry:check', 'the registry and the component index'],
  ['tokens:check', 'the DTCG token export'],
  ['llms:check', 'llms.txt'],
  ['gen:shadcn:check', 'the installable registry in r/'],
  ['gen:skill:check', 'the Agent Skill'],
  ['gen:data:check', 'public/data'],
]
const stale = []
for (const [script, what] of generators) {
  try { execFileSync('npm', ['run', '--silent', script], { cwd: ROOT, stdio: 'pipe' }) }
  catch { stale.push([script, what]) }
}

console.log(`${BOLD}Impact${RESET} ${DIM}${changed.length} changed file(s)${ref ? ` against ${ref}` : ''}${RESET}\n`)
if (parts.size) {
  console.log(`  ${BOLD}parts${RESET} ${[...parts].sort().join(', ')}`)
  console.log(`  ${BOLD}baselines that carry them${RESET} ${baselines.length}${baselines.length ? ` ${DIM}(visual, heights and the screens will re-shoot these)${RESET}` : ''}`)
}
if (touchedTokens.size) {
  console.log(`  ${BOLD}tokens touched${RESET} ${touchedTokens.size}`)
  const ranked = [...readers].sort((a, b) => b[1].size - a[1].size).slice(0, 6)
  for (const [t, who] of ranked) console.log(`      ${t} ${DIM}read by ${who.size} part(s): ${[...who].slice(0, 6).join(', ')}${who.size > 6 ? ' …' : ''}${RESET}`)
  const unread = [...touchedTokens].filter((t) => !readers.has(t))
  if (unread.length) {
    console.log(`      ${YEL}${unread.length} touched token(s) with no reader${RESET} ${DIM}— ${unread.slice(0, 8).join(' ')}${unread.length > 8 ? ' …' : ''}${RESET}`)
    console.log(`      ${DIM}a ladder step and a value @media cannot read are both legitimate here; lint:token-layer decides, this only points${RESET}`)
  }
}
if (stale.length) {
  console.log(`  ${BOLD}${YEL}stale now${RESET} ${stale.map(([, what]) => what).join(', ')}`)
  console.log(`      ${DIM}run: ${stale.map(([s]) => `npm run ${s.replace(':check', '')}`).join(' && ')}${RESET}`)
} else {
  console.log(`  ${GREEN}nothing generated is stale${RESET}`)
}
console.log(`\n  ${DIM}This is what to look at, not a verdict. The gate is still the gate.${RESET}`)
