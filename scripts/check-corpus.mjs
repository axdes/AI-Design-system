#!/usr/bin/env node
/* The catch table: every defect we know about has a check that finds it, or a
 * written statement that it cannot be checked and why.
 *
 * Every other step here asks whether the code is right. This one asks whether
 * the GATE is worth having, and it is the only question the gate cannot answer
 * about itself. The number it prints is the one that matters: of the things
 * that actually went wrong, how many would a person still have to notice by
 * eye. In the system this one carries from, that ratio was 34 by eye against 7
 * by the gate — and every check added since exists to move it.
 *
 * A defect with no check and no reason is the state a system lives in for
 * months without noticing: the fix ships, the lesson evaporates, and the same
 * shape comes back somewhere else. So the check is not "are we at zero", it is
 * "does every entry say what happened to it".
 *
 * POPULATION: config/defects.json, seeded by hand from docs/CHANGELOG-REVIEW.md
 * and from what this session found. It is NOT the whole history and says so:
 * `unclassified` counts the entries nobody has read into it yet, and that
 * number may only fall.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const ROOT = process.env.DS_LINT_ROOT ?? fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const RESET = '\x1b[0m', RED = '\x1b[31m', GREEN = '\x1b[32m', DIM = '\x1b[2m', BOLD = '\x1b[1m', YEL = '\x1b[33m'

const corpus = JSON.parse(readFileSync(`${ROOT}/config/defects.json`, 'utf8'))
const { defects } = corpus
const problems = []

const STATUSES = new Set(['proven', 'uncheckable', 'blocked'])
const seen = new Set()
for (const d of defects) {
  const at = d.id ?? '(a defect with no id)'
  if (!d.id) problems.push('a defect with no id')
  else if (seen.has(d.id)) problems.push(`${at}: listed twice`)
  else seen.add(d.id)
  if (!d.was || String(d.was).length < 40) problems.push(`${at}: does not say what was wrong, in enough words to recognise it again`)
  if (!d.date) problems.push(`${at}: has no date`)
  if (!STATUSES.has(d.status)) problems.push(`${at}: status must be ${[...STATUSES].join(' | ')}`)
  if (d.status === 'proven' && !d.check) problems.push(`${at}: called proven and names no check`)
  if (d.status === 'proven' && !d.evidence) problems.push(`${at}: called proven with no evidence of the run that proved it`)
  if (d.status === 'uncheckable' && !d.evidence) problems.push(`${at}: called uncheckable with no reason written down — that reason is the whole value of the entry`)
  if (d.status === 'blocked' && !d.blockedBy) problems.push(`${at}: called blocked without saying by what`)
}

/* The ratio, which is the point. Only entries that say how they were found
 * count towards it; anything else would be a number about our record-keeping. */
const byEye = defects.filter((d) => d.foundBy === 'eye').length
const byCheck = defects.filter((d) => d.foundBy === 'check').length
const covered = defects.filter((d) => d.check).length

console.log(`${BOLD}Defect corpus${RESET} ${DIM}${defects.length} classified, ${corpus.unclassified} entries not read into it yet${RESET}\n`)
console.log(`  found by a person looking:  ${byEye}`)
console.log(`  found by a check:           ${byCheck}`)
console.log(`  now has a check:            ${covered} of ${defects.length}`)
const uncheckable = defects.filter((d) => d.status === 'uncheckable')
const blocked = defects.filter((d) => d.status === 'blocked')
if (uncheckable.length) console.log(`  ${YEL}cannot be checked:${RESET}          ${uncheckable.length} ${DIM}(${uncheckable.map((d) => d.id).join(', ')})${RESET}`)
if (blocked.length) console.log(`  ${YEL}waiting on something:${RESET}       ${blocked.length} ${DIM}(${blocked.map((d) => d.id).join(', ')})${RESET}`)
console.log()

if (problems.length) {
  console.error(`${RED}✗ ${problems.length} entr${problems.length === 1 ? 'y' : 'ies'} that say too little${RESET}\n`)
  for (const p of problems) console.error(`  ${RED}·${RESET} ${p}`)
  console.error(`\n  ${DIM}A defect carried with no check and no reason is the silence this corpus exists to end.${RESET}`)
  process.exit(1)
}
console.log(`${GREEN}✓${RESET} every classified defect names the check that finds it, or says why it cannot be checked.`)
