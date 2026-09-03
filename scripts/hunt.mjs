#!/usr/bin/env node
/* Every number this system holds itself to, next to today's, in one place.
 *
 * The gate answers yes or no. That is what a gate is for, and it is useless for
 * the question a person actually has on a Monday: what is worth looking at. The
 * checks here already record opening balances — the API ceilings, the mechanism
 * pairs, the spacing answers, the defect corpus — and each one prints its own
 * slice of the truth inside a step that only says pass or fail. Read together
 * they say where the system is drifting and where it is being paid down, and
 * nothing was reading them together.
 *
 * Not a check. It never fails, it never blocks a commit, and it takes no
 * arguments. If a number here is wrong, the check that owns it is the one to
 * fix.
 *
 * POPULATION: derived — the recorded balances themselves, and the checks that
 * produce today's numbers.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const RESET = '\x1b[0m', GREEN = '\x1b[32m', RED = '\x1b[31m', DIM = '\x1b[2m', BOLD = '\x1b[1m', YEL = '\x1b[33m'
const read = (p) => (existsSync(`${ROOT}/${p}`) ? JSON.parse(readFileSync(`${ROOT}/${p}`, 'utf8')) : null)
const run = (script) => {
  try { return execFileSync('npm', ['run', '--silent', script], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) }
  catch (e) { return `${e.stdout ?? ''}${e.stderr ?? ''}` }
}
const num = (text, re) => { const m = re.exec(text ?? ''); return m ? Number(m[1]) : null }

const rows = []
const row = (what, held, now, note) => rows.push({ what, held, now, note })

const api = read('config/api-debt.json')
const apiOut = run('lint:api')
if (api) {
  row('prop names with more than one type', Object.keys(api.shapes).length, num(apiOut, /— (\d+) carry more than one type/), 'lint:api A1')
  /* Two numbers, because A2 has two: how many parts are past seven at all — the
   * ceiling holds each of their counts — and how many of those have not said why.
   * Reading the second against the first said "-42 paid down" on the day the
   * reasons were written, which is not what happened. */
  row('parts past seven props', Object.keys(api.props).length, num(apiOut, /(\d+) argued/) + num(apiOut, /(\d+) past seven props with no reason/), 'lint:api A2')
  row('  of those, with no reason written', 0, num(apiOut, /(\d+) past seven props with no reason/), 'lint:api A2')
  row('callbacks outside the vocabulary', Object.keys(api.callbacks).length, num(apiOut, /(\d+) callbacks outside/), 'lint:api A3')
  row('parts with no test', api.untested.length, num(apiOut, /(\d+) without a test/), 'lint:api A4')
  row('props nothing here passes', Object.values(api.cold ?? {}).reduce((n, ps) => n + ps.length, 0), num(apiOut, /(\d+) props nothing here passes/), 'lint:api A5')
}
const mech = read('config/mechanism-debt.json')
if (mech) row('behaviours written twice', Object.keys(mech.pairs).length, num(run('lint:mechanism'), /— (\d+) pair\(s\)/), 'lint:mechanism')

const answers = read('config/token-answers.json')
if (answers) for (const [question, held] of Object.entries(answers.answers)) {
  row(`answers to "${question}"`, held, held, 'lint:token-layer L5')
}

const defects = read('config/defects.json')
if (defects) {
  const eye = defects.defects.filter((d) => d.foundBy === 'eye').length
  const check = defects.defects.filter((d) => d.foundBy === 'check').length
  row('defects found by eye vs by a check', null, null, `${eye} by eye, ${check} by a check, ${defects.unclassified} log entries unread`)
}

console.log(`${BOLD}Hunt${RESET} ${DIM}every recorded balance, against today${RESET}\n`)
const pad = Math.max(...rows.map((r) => r.what.length))
for (const r of rows) {
  if (r.held === null) { console.log(`  ${r.what.padEnd(pad)}  ${DIM}${r.note}${RESET}`); continue }
  const now = r.now ?? r.held
  const delta = now - r.held
  const mark = delta > 0 ? `${RED}+${delta}${RESET}` : delta < 0 ? `${GREEN}${delta}${RESET}` : `${DIM}—${RESET}`
  console.log(`  ${r.what.padEnd(pad)}  ${String(now).padStart(4)}  ${DIM}recorded ${r.held}${RESET}  ${mark}  ${DIM}${r.note}${RESET}`)
}
console.log(`\n  ${DIM}A number below its balance is paid-down debt somebody has not re-recorded.`)
console.log(`  A number above it is why the gate is red. ${YEL}Neither is an opinion.${RESET}`)
