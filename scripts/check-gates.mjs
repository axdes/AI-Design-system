#!/usr/bin/env node
/* The gate list, held to itself — as a step, not only as a precondition.
 *
 * `run-gates.mjs` already validates before it runs anything, so a broken
 * manifest cannot start a run. That leaves the case that actually happens: the
 * manifest is EDITED and nothing runs it. A step added without a population, a
 * `needs` pointing at a name that was renamed, a CI mode quietly dropping a
 * check — all of it sits green in the working tree until somebody runs the gate
 * for another reason.
 *
 * So the same validator runs as a step of its own, first in the lane, and a
 * broken list fails the way everything else does. It is also what the red team
 * breaks against. (2026-09-02)
 *
 * POPULATION: derived from GATES itself and from package.json.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { GATES, validate, gatesFor } from './gates.mjs'

const ROOT = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const RESET = '\x1b[0m', RED = '\x1b[31m', GREEN = '\x1b[32m', DIM = '\x1b[2m'

const scripts = JSON.parse(readFileSync(`${ROOT}/package.json`, 'utf8')).scripts
const problems = validate(scripts)

if (problems.length) {
  console.error(`${RED}✗ the gate list does not hold${RESET}\n`)
  for (const p of problems) console.error(`  ${RED}·${RESET} ${p}`)
  console.error(`\n  ${DIM}scripts/gates.mjs is the one list; the modes are derived from it.${RESET}`)
  process.exit(1)
}

const derived = GATES.filter((g) => String(g.population).startsWith('derived')).length
const local = GATES.filter((g) => g.localOnly).length
console.log(
  `${GREEN}✓${RESET} ${GATES.length} step(s): ${derived} derive their subjects from the code, ` +
    `${GATES.length - derived} name their own and say why, ${GATES.length} say what they started as. ` +
    `${DIM}CI runs ${gatesFor('ci').length}, and the ${local} it drops each carry a reason.${RESET}`,
)
