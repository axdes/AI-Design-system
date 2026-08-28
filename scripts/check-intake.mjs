#!/usr/bin/env node
/* A refusal nobody answered stops being a process.
 *
 * `npm run intake` reads somebody else's requirements document and lists every
 * value in it the system will not take: a length off the scale, a component that
 * does not exist, a prop value nothing publishes. Each one is a question put to
 * a person, and the report leaves a `> decision:` line under it to be answered.
 *
 * The same failure mode as requests/, and it was watched happening there first:
 * three records sat `pending` for six weeks while all three had already been
 * built, and the folder had no way to say so out loud. A folder of unanswered
 * refusals is worse than no folder, because it looks like the reconciliation was
 * done.
 *
 * Two rules:
 *
 *   1. Every refusal carries a decision, or the report carries one
 *      `> waitingFor: <what it waits for>` line that covers the file. The same
 *      contract the linter's ALLOW map and the promotion scout run on: an open
 *      item names a reason and the condition that would close it.
 *   2. A report older than STALE_DAYS with refusals still unanswered is red
 *      whatever it says it is waiting for. Waiting is a state, not a home.
 *
 * Run: node scripts/check-intake.mjs   (wired into `npm run check`)
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const RED = '\x1b[31m', GREEN = '\x1b[32m', DIM = '\x1b[2m', R = '\x1b[0m'
const STALE_DAYS = 30

const dir = `${ROOT}/intake`
if (!existsSync(dir)) {
  console.log(`${GREEN}✓${R} no intake reports. ${DIM}Nothing has been reconciled against this system yet.${R}`)
  process.exit(0)
}

const files = readdirSync(dir).filter((f) => f.endsWith('.findings.md'))

/** One report, read the way the writer writes it. */
function parse(name) {
  const text = readFileSync(`${dir}/${name}`, 'utf8')
  const read = /^Read:\s*(\d{4}-\d{2}-\d{2})/m.exec(text)?.[1] ?? null
  /* `[ \t]` and not `\s` after the colon, both here and for a decision: `\s`
   * matches a NEWLINE, so an empty `> decision:` swallowed the blank line under
   * it and read the next heading as the answer. The last refusal in every report
   * came back answered by the words "Questions this could not answer". */
  const waitingFor = /^>[ \t]*waitingFor:[ \t]*(\S.*)$/m.exec(text)?.[1]?.trim() ?? null
  /* Refusals are numbered `### R<n> · <quote>` and each is followed by its own
   * `> decision:` line. Split on the heading and look inside each part, so a
   * decision written under one refusal cannot be read as answering the next. */
  const parts = text.split(/^### (R\d+) · /m).slice(1)
  const refusals = []
  for (let i = 0; i < parts.length; i += 2) {
    const id = parts[i]
    const body = parts[i + 1] ?? ''
    const quote = body.split('\n')[0].trim()
    const decision = /^>[ \t]*decision:[ \t]*(.*)$/m.exec(body)?.[1]?.trim() ?? null
    refusals.push({ id, quote, answered: !!decision })
  }
  return { name, read, waitingFor, refusals }
}

const reports = files.map(parse)

/* Today from the newest report rather than from the clock, for the reason
 * check-requests.mjs derives it the same way: the gate has to give one answer on
 * a machine and the same answer on a clone made a year later, and a check whose
 * result depends on when it runs cannot be part of a build. */
const dates = reports.map((r) => r.read).filter(Boolean).sort()
const today = dates.length ? Date.parse(dates[dates.length - 1]) : null
const ageDays = (r) => (today && r.read ? Math.round((today - Date.parse(r.read)) / 86_400_000) : 0)

const problems = []
let open = 0

for (const r of reports) {
  const unanswered = r.refusals.filter((x) => !x.answered)
  open += unanswered.length
  if (!unanswered.length) continue
  const age = ageDays(r)
  if (age >= STALE_DAYS) {
    problems.push(`${r.name}: ${unanswered.length} refusal(s) unanswered for ${age} days${r.waitingFor ? ` (waiting for: ${r.waitingFor})` : ''} — waiting is a state, not a home`)
    continue
  }
  if (!r.waitingFor) {
    problems.push(`${r.name}: ${unanswered.length} refusal(s) with no decision and nothing saying what they wait for — ${unanswered.slice(0, 3).map((x) => `${x.id} ${x.quote}`).join('; ')}`)
  }
  if (!r.read) problems.push(`${r.name}: no "Read: YYYY-MM-DD" line, so its age cannot be judged. Re-run npm run intake rather than editing the header by hand.`)
}

if (problems.length) {
  console.error(`\n${RED}✗ intake${R} ${DIM}${reports.length} report(s)${R}\n`)
  for (const p of problems) console.error(`  ${RED}✗${R} ${p}`)
  console.error(`\n  ${DIM}Answer a refusal by writing after its "> decision:" line — take the substitute,`)
  console.error(`  or say why the system should change and file it in requests/. A whole report may`)
  console.error(`  say "> waitingFor: <what>" while it waits, for up to ${STALE_DAYS} days.${R}\n`)
  process.exit(1)
}

const total = reports.reduce((n, r) => n + r.refusals.length, 0)
console.log(`${GREEN}✓${R} intake: ${reports.length} report(s), ${total} refusal(s), ${open} still open. ${DIM}${open ? 'Every open one says what it waits for.' : 'All answered.'}${R}`)
