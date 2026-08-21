#!/usr/bin/env node
/* Run the gate for a mode, from the one list in gates.mjs.
 *
 *   node scripts/run-gates.mjs              everything (npm run check)
 *   node scripts/run-gates.mjs --mode ci    everything that is not machine-specific
 *   node scripts/run-gates.mjs --list       what would run, and why, without running it
 *   node scripts/run-gates.mjs --from lint  start at a step, after fixing something
 *   node scripts/run-gates.mjs --serial     one lane, output live, for debugging
 *   node scripts/run-gates.mjs --timings    where the wall clock went
 *
 * Before it runs anything it checks the list itself: every step has to be a real
 * npm script, no step may appear twice, a step may only leave a mode by carrying
 * a written reason, and a step that needs another one's output is listed after
 * it. That is the property the two `&&` chains could not have — a check cannot
 * silently stop running in CI, because the only way out is a sentence somebody
 * has to write.
 *
 * LANES. The steps run in four groups at once, each group in order, and a step
 * that `needs` another waits for it across lanes. Its own timing report is why:
 * of a 143-second wall clock, `eval` was 55 and the three browser passes 57,
 * while the other 21 steps came to ten seconds together. Same checks, same
 * order within a lane, 37 seconds.
 *
 * Output is buffered per step and printed when the step finishes, because three
 * lanes writing to one terminal at once is not something anybody can read. A
 * failure prints its whole output; `--serial` puts the old live behaviour back.
 */
import { execFile } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { GATES, MODES, isMode, gatesFor, lanesOf, validate } from './gates.mjs'

const ROOT = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const RED = '\x1b[31m', GREEN = '\x1b[32m', DIM = '\x1b[2m', BOLD = '\x1b[1m', OFF = '\x1b[0m'

const argv = process.argv.slice(2)
const valueOf = (name) => {
  const i = argv.indexOf(`--${name}`)
  return i === -1 ? null : argv[i + 1]
}
const mode = valueOf('mode') ?? 'full'
const from = valueOf('from')
const serial = argv.includes('--serial')
const showTimings = argv.includes('--timings') || Boolean(process.env.GATE_TIMINGS)

if (!isMode(mode)) {
  console.error(`${RED}✗ no such mode: ${mode}${OFF}  (${Object.keys(MODES).join(', ')})`)
  process.exit(2)
}

const pkg = JSON.parse(readFileSync(`${ROOT}/package.json`, 'utf8'))
const problems = validate(pkg.scripts)
if (problems.length) {
  console.error(`${RED}✗ the gate list is wrong before a single check has run:${OFF}`)
  for (const p of problems) console.error(`    ${p}`)
  process.exit(2)
}

const all = gatesFor(mode)
const skipped = GATES.filter((g) => !all.includes(g))
const begin = from ? all.findIndex((g) => g.run === from) : 0
if (begin === -1) {
  console.error(`${RED}✗ --from ${from}: not a step of the ${mode} gate${OFF}`)
  process.exit(2)
}
const steps = all.slice(begin)
const lanes = serial ? new Map([['serial', steps]]) : lanesOf(steps)

if (argv.includes('--list')) {
  console.log(`${BOLD}Gate — ${mode}${OFF} ${DIM}${steps.length} of ${GATES.length} steps, ${lanes.size} lane(s)${OFF}\n`)
  for (const [name, list] of lanes) {
    console.log(`  ${BOLD}${name}${OFF}`)
    for (const g of list) {
      console.log(`    ${g.run.padEnd(20)} ${DIM}${g.why}${g.needs ? ` (after ${g.needs})` : ''}${OFF}`)
    }
  }
  for (const g of skipped) console.log(`\n  ${DIM}—  ${g.run.padEnd(20)} not in this mode: ${g.localOnly}${OFF}`)
  process.exit(0)
}

/* ── run ─────────────────────────────────────────────────────────────── */
const run = (name) =>
  new Promise((resolve) => {
    const began = Date.now()
    execFile('npm', ['run', name], { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 }, (err, stdout, stderr) => {
      resolve({ name, ok: !err, ms: Date.now() - began, output: `${stdout}${stderr}` })
    })
  })

console.log(
  `${BOLD}Gate — ${mode}${OFF} ${DIM}${steps.length} step(s), ${lanes.size} lane(s)${skipped.length ? `, ${skipped.length} machine-specific and left out` : ''}${OFF}\n`,
)

const began = Date.now()
const timings = []
const notRun = []
let failed = null

/* A step that `needs` another waits for it wherever it runs. One promise per
 * step name, resolved when that step finishes, is the whole mechanism — it is
 * what lets the two browser passes sit in different lanes and still share the
 * single build they both depend on. */
const done = new Map()
for (const g of steps) done.set(g.run, Promise.withResolvers())

async function runLane(laneName, list) {
  for (const gate of list) {
    if (gate.needs && done.has(gate.needs)) await done.get(gate.needs).promise
    if (failed) {
      notRun.push(gate.run)
      done.get(gate.run).resolve()
      continue
    }
    const result = await run(gate.run)
    done.get(gate.run).resolve()
    timings.push(result)
    const mark = result.ok ? `${GREEN}✓${OFF}` : `${RED}✗${OFF}`
    console.log(
      `${mark} ${BOLD}${gate.run.padEnd(20)}${OFF} ${DIM}${(result.ms / 1000).toFixed(1).padStart(5)}s · ${laneName} · ${gate.why}${OFF}`,
    )
    if (!result.ok) {
      failed = gate.run
      console.error(`\n${result.output.trimEnd()}\n`)
    }
  }
}

await Promise.all([...lanes].map(([name, list]) => runLane(name, list)))

const total = Date.now() - began

if (failed) {
  console.error(
    `${RED}✗ ${failed} failed${OFF} ${DIM}(${notRun.length} step(s) did not run: ${notRun.join(', ') || 'none'})${OFF}`,
  )
  console.error(`  ${DIM}Fix it, then \`npm run check -- --from ${failed}\` to carry on from here.${OFF}\n`)
  process.exit(1)
}

console.log(`\n${GREEN}✓ the ${mode} gate is green${OFF} ${DIM}${steps.length} step(s) in ${(total / 60000).toFixed(1)} min${OFF}`)
if (skipped.length) {
  console.log(`  ${DIM}left out here: ${skipped.map((g) => g.run).join(', ')} — machine-specific, and they say why in scripts/gates.mjs${OFF}`)
}

if (showTimings) {
  const work = timings.reduce((n, t) => n + t.ms, 0)
  console.log(
    `\n  ${BOLD}where the time went${OFF} ${DIM}${(work / 1000).toFixed(0)}s of work in ${(total / 1000).toFixed(0)}s of wall clock${OFF}`,
  )
  for (const t of [...timings].sort((a, b) => b.ms - a.ms)) {
    const share = Math.round((t.ms / work) * 100)
    console.log(`  ${String((t.ms / 1000).toFixed(1)).padStart(6)}s  ${String(share).padStart(2)}%  ${t.name.padEnd(20)} ${DIM}${'█'.repeat(Math.max(1, Math.round(share / 2)))}${OFF}`)
  }
  for (const [name, list] of lanes) {
    const laneMs = timings.filter((t) => list.some((g) => g.run === t.name)).reduce((n, t) => n + t.ms, 0)
    console.log(`  ${DIM}lane ${name.padEnd(8)} ${(laneMs / 1000).toFixed(0)}s${OFF}`)
  }
  console.log(`  ${DIM}The critical path is the longest lane. Move a step between lanes in scripts/gates.mjs.${OFF}`)
}
