#!/usr/bin/env node
/* Behaviour is a part, and is held to what a part is held to.
 *
 *   M1  a mechanism says what it is for, in a comment above it
 *   M2  a mechanism has a caller, or says why it is published without one
 *
 * The catalogue has had discovery-first since the beginning: an index row per
 * component, a golden example, a level, and a linter that fails a component
 * nobody named. Behaviour had none of it. `src/lib` is where the hooks live,
 * outside the registry, with no index row and no rule — and the cost was
 * measured on 2026-08-31 in the system this one carries from: `useAnchoredLayer`
 * existed and did the whole job, while Tooltip, HoverCard, ContextMenu and
 * CommandPalette each wrote their own. Four of six floating layers reached for
 * memory instead of discovery, because there was nothing to discover.
 *
 * lint:mechanism (singular) catches the duplication after the fact. This is the
 * half before it: a mechanism nobody can find is a mechanism somebody rewrites,
 * and a mechanism nobody calls is a mechanism that was written ahead of a
 * caller. Publishing them through the registry, so `npm run registry -- --search`
 * answers with behaviour as well as components, is the next step and is not
 * done: this check is the floor under it.
 *
 * POPULATION: derived — every module in src/lib that exports something, and
 * every import of it in src/, visual/ and apps/showcase.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = process.env.DS_LINT_ROOT ?? fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const RESET = '\x1b[0m', RED = '\x1b[31m', GREEN = '\x1b[32m', DIM = '\x1b[2m', BOLD = '\x1b[1m'
const LIB = join(ROOT, 'src/lib')

const walk = (dir, out = []) => {
  if (!existsSync(dir)) return out
  for (const e of readdirSync(dir)) {
    const p = join(dir, e)
    if (statSync(p).isDirectory()) { if (!/node_modules|dist/.test(p)) walk(p, out) }
    else if (/\.tsx?$/.test(e)) out.push(p)
  }
  return out
}
const read = (f) => readFileSync(f, 'utf8')

/* A mechanism is a module in lib/ that exports behaviour. A .test file is not
 * one, and neither is a type-only module: nothing is asked of a shape. */
const mechanisms = readdirSync(LIB)
  .filter((f) => /\.tsx?$/.test(f) && !/\.test\./.test(f))
  .map((f) => ({ name: f.replace(/\.tsx?$/, ''), file: join(LIB, f) }))
  .filter((m) => /export\s+(async\s+)?(function|const|class)/.test(read(m.file)))

const consumers = [...walk(join(ROOT, 'src')), ...walk(join(ROOT, 'visual')), ...walk(join(ROOT, '../../apps/showcase/src'))]
const callersOf = new Map(mechanisms.map((m) => [m.name, new Set()]))
for (const f of consumers) {
  if (f.startsWith(LIB) || /\.test\./.test(f)) continue
  const src = read(f)
  for (const m of src.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
    const name = basename(m[1])
    if (callersOf.has(name)) callersOf.get(name).add(f)
  }
}

const problems = []
const say = (rule, where, msg, fix) => problems.push({ rule, where, msg, fix })

for (const m of mechanisms) {
  const src = read(m.file)
  /* The index row may open the file or sit directly above the export — both are
   * normal in TypeScript, where the imports come first. What is not normal is
   * neither: an exported behaviour with nothing anywhere saying what it is for. */
  const opensFile = /^(?:\/\*[\s\S]*?\*\/|(?:\/\/[^\n]*\n)+)/.test(src.trimStart())
  const aboveExport = /(?:\*\/|\/\/[^\n]*)\s*\n\s*export\s+(?:async\s+)?(?:function|const|class)/.test(src)
  if (!opensFile && !aboveExport) {
    say('M1', `src/lib/${basename(m.file)}`, 'starts with code and says nothing about itself',
      'the first sentence is the index row: what this behaviour is for, and when to reach for it instead of writing it again. Four floating layers were written by hand beside a hook that already did the job, and nothing about that hook told anybody it was there.')
  }
  const callers = callersOf.get(m.name)
  if (!callers.size && !/published because|no caller here because/i.test(src)) {
    say('M2', `src/lib/${basename(m.file)}`, 'has no caller in the system or its showcase',
      'nothing is built ahead of a caller, and behaviour is not the exception. Delete it, or write "published because …" in the file and say which product takes it and why that is the right home for it.')
  }
}

const documented = mechanisms.length - problems.filter((p) => p.rule === 'M1').length
const called = mechanisms.filter((m) => callersOf.get(m.name).size).length
console.log(
  `${BOLD}Mechanisms${RESET} ${DIM}${mechanisms.length} in src/lib — ${documented} say what they are for, ${called} have a caller here${RESET}\n`,
)
if (!problems.length) {
  console.log(`${GREEN}✓${RESET} every mechanism says what it is for and has somebody who calls it.`)
  process.exit(0)
}
const byRule = new Map()
for (const p of problems) { if (!byRule.has(p.rule)) byRule.set(p.rule, []); byRule.get(p.rule).push(p) }
const TITLE = { M1: 'a mechanism nobody can find', M2: 'a mechanism nobody calls' }
console.error(`${RED}${problems.length} finding(s)${RESET}\n`)
for (const [rule, list] of [...byRule].sort()) {
  console.error(`${BOLD}${rule}${RESET} ${TITLE[rule]} ${DIM}(${list.length})${RESET}`)
  for (const p of list) console.error(`  ${RED}${p.where}${RESET}  ${p.msg}\n      ${p.fix}\n`)
}
process.exit(1)
