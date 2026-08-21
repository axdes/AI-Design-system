#!/usr/bin/env node
/* A request is a question waiting for an answer, and a question nobody answers
 * stops being a process.
 *
 * requests/ is the escalation channel: when nothing in the registry covers a
 * need, the agent files a record and STOPS instead of hand-rolling JSX. That
 * only works while the records get decided. Three of them sat `pending` from
 * 2026-07-11 to 2026-08-21 — six weeks — and all three had been BUILT within
 * days of being filed. Nobody was waiting on anything; the folder simply had no
 * way to say so out loud (found by the owner reading the published repo).
 *
 * Two rules, both mechanical:
 *
 *   1. `pending` while the component exists in the registry. The decision was
 *      taken in practice and never written down, which is the worst of the two
 *      states: the folder claims the system is waiting for a call that was made
 *      weeks ago.
 *   2. `pending` for more than STALE_DAYS with nothing saying what it waits for.
 *      Fix it by deciding, or by adding `waitingFor` — the same contract the
 *      linter's ALLOW map and the promotion scout run on: an open item carries a
 *      reason and the condition that would close it.
 *
 * Run: node scripts/check-requests.mjs   (wired into `npm run check`)
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const RED = '\x1b[31m', GREEN = '\x1b[32m', DIM = '\x1b[2m', R = '\x1b[0m'
const STALE_DAYS = 30

const dir = `${ROOT}/requests`
const files = readdirSync(dir).filter((f) => f.endsWith('.json'))
const problems = []
let pending = 0

/* Today from the newest request rather than the clock: the gate has to give the
 * same answer on any machine and in CI, and a check whose verdict changes while
 * nothing was edited is a check people learn to re-run instead of read. */
const dates = files
  .map((f) => JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')).date)
  .filter(Boolean)
  .sort()
const today = new Date(dates[dates.length - 1])

for (const file of files.sort()) {
  const r = JSON.parse(readFileSync(`${dir}/${file}`, 'utf8'))
  if (r.status !== 'pending') continue
  pending += 1

  if (existsSync(`${ROOT}/registry/${r.name}.json`)) {
    problems.push(`${file}: ${r.name} is IN the registry and this still says pending — write the decision that was already taken`)
    continue
  }
  const age = Math.round((today - new Date(r.date)) / 86400000)
  if (age > STALE_DAYS && !r.waitingFor) {
    problems.push(`${file}: pending for ${age} days with nothing saying why — decide it, or add "waitingFor" with the condition that would close it`)
  }
}

if (problems.length) {
  console.error(`${RED}✗ ${problems.length} request(s) nobody is actually waiting on:${R}`)
  for (const p of problems) console.error('    ' + p)
  console.error(`  ${DIM}requests/README.md has the four decisions: compose, approved, rejected, withdrawn.${R}`)
  process.exit(1)
}
console.log(`${GREEN}✓ ${files.length} request(s), ${pending} genuinely open.${R}`)
