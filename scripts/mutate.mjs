#!/usr/bin/env node
/* Mutation testing: does the test suite NOTICE when the code is wrong?
 *
 * Coverage answers a different question. `npm run test:cov` says 82.6% of
 * statements ran; it cannot say whether anything would have failed had they run
 * wrongly. Measured on 2026-08-26 the first time: 207 mutants, 120 killed, 58%.
 * A third of the ways this code can break, nothing in the repository notices.
 *
 * Five of those were real holes in one afternoon — five controls whose
 * accessible NAME nothing was holding, found because deleting the name left 471
 * tests and an axe sweep over every golden example perfectly green.
 *
 * The operators are the ways this code actually breaks, not a textbook list: a
 * flipped default, an `&&` that became an `||`, a dropped `aria-label`, a
 * swapped branch, a lost `{...rest}`, an off-by-one, a widened comparison.
 *
 *   npm run mutate              measure everything, rewrite the baseline
 *   npm run mutate -- --check   the gate: re-measure only what CHANGED
 *   npm run mutate -- --list    the operators, and why each one is here
 *
 * The FLOOR is what stops the number sliding. `--check` rewrites the baseline as
 * it goes (it has to, or the next run re-measures the same components and calls
 * every survivor a regression), and a baseline that rewrites itself is a record
 * that can erode one point at a time while every run stays green. So the floor
 * is written only by a deliberate full `npm run mutate`, and `--check` fails
 * when the score falls under it. Lowering the floor is a decision somebody
 * makes, not a side effect of an edit.
 *
 * TWO PASSES, and the second is why the number is honest. A component's own
 * tests run first because they are fast and kill most of it. What they cannot
 * kill is anything a CROSS-CUTTING test holds — the axe sweep over every golden
 * example, the passthrough test over every component that spreads its props,
 * the specimen coverage — because those live in src/test and a folder-scoped run
 * never loads them. Measured 2026-08-28: the passthrough test killed six
 * mutants the score still counted as survivors. So a survivor is re-run against
 * src/test before it is recorded, and only what survives BOTH is a survivor.
 * The cheap pass does the volume; the expensive one only pays for the tail.
 *
 * WHY --check only re-measures changed components. A full pass is ~14 minutes,
 * which is twenty times the whole gate, so running it on every commit would end
 * with someone deleting the step. A component whose source is byte-identical to
 * the baseline cannot have changed its own mutation score, so the honest cheap
 * check is: measure what moved, and fail when a mutant that USED to die starts
 * surviving — a test that quietly stopped biting. A component with tests and no
 * baseline row fails too; that is how a new part gets measured at all.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const BASELINE = `${ROOT}/mutation-baseline.json`
const RED = '\x1b[31m', GREEN = '\x1b[32m', DIM = '\x1b[2m', BOLD = '\x1b[1m', OFF = '\x1b[0m'

/** Each operator is a way real code has gone wrong here, not a textbook entry. */
const OPS = [
  { id: 'boolean-default', why: 'a default flipped: the component ships in the other state', re: /= true\b/, to: '= false' },
  { id: 'and-to-or', why: 'a guard widened: the branch runs when only one condition holds', re: / && /, to: ' || ' },
  { id: 'strip-aria', why: 'the accessible NAME deleted — the failure this file first found, five times', re: /\s+aria-label=\{[^}]+\}/, to: '' },
  { id: 'negate-cond', why: 'the two arms of a ternary swapped', re: /\?\s*'([^']*)'\s*:\s*'([^']*)'/, to: "? '$2' : '$1'" },
  { id: 'drop-optional-render', why: 'a conditional part never renders', re: /\{(\w+) && /, to: '{false && ' },
  { id: 'off-by-one', why: 'the last item, or one past it', re: /\blength - 1\b/, to: 'length' },
  { id: 'invert-comparison', why: 'a boundary widened by one', re: / > /, to: ' >= ' },
  { id: 'drop-spread', why: 'the passthrough dropped: className, id and every data- attribute stop arriving', re: /\s\{\.\.\.rest\}/, to: '' },
]

const argv = process.argv.slice(2)
const check = argv.includes('--check')

if (argv.includes('--list')) {
  console.log(`${BOLD}What the mutation run tries${OFF}\n`)
  for (const o of OPS) console.log(`  ${o.id.padEnd(22)}${DIM}${o.why}${OFF}`)
  process.exit(0)
}

const tested = readdirSync(`${ROOT}/src/components`)
  .filter((d) => existsSync(`${ROOT}/src/components/${d}/${d}.test.tsx`) && existsSync(`${ROOT}/src/components/${d}/${d}.tsx`))

const digest = (name) => createHash('sha1')
  .update(readFileSync(`${ROOT}/src/components/${name}/${name}.tsx`))
  .update(readFileSync(`${ROOT}/src/components/${name}/${name}.test.tsx`))
  .digest('hex').slice(0, 12)

const prior = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, 'utf8')) : { components: {} }

/* Only what moved. A component whose source AND test are byte-identical cannot
   have changed its own answer, and re-running it would buy nothing. */
const todo = check ? tested.filter((n) => prior.components[n]?.hash !== digest(n)) : tested

const missing = check ? tested.filter((n) => !prior.components[n]) : []
const FLOOR = prior.floor ?? prior.score ?? 0
if (check && !todo.length && !missing.length) {
  const s = prior.score ?? 0
  console.log(`${GREEN}✓ mutation score ${s}%${OFF} ${DIM}unchanged — no component's source or test moved since the baseline${OFF}`)
  process.exit(0)
}

console.log(`${BOLD}Mutation${OFF} ${DIM}${todo.length} component(s)${check ? ' changed since the baseline' : ''}${OFF}\n`)

const results = { ...prior.components }
const regressions = []
for (const name of todo) {
  const file = `${ROOT}/src/components/${name}/${name}.tsx`
  const original = readFileSync(file, 'utf8')
  const row = { hash: digest(name), killed: [], survived: [] }
  for (const op of OPS) {
    if (!op.re.test(original)) continue
    const mutated = original.replace(op.re, op.to)
    if (mutated === original) continue
    writeFileSync(file, mutated)
    let died = false
    /* `ignore`, not `pipe`: only the exit code matters, and piping a full test
       run's output through execSync throws ENOBUFS on the wide passes — which is
       how a sweep died silently and left the baseline a generation behind
       (2026-08-28). */
    try { execSync(`npx vitest run src/components/${name} --reporter=dot`, { cwd: ROOT, stdio: 'ignore', timeout: 300000 }) }
    catch { died = true }
    /* Survived its own tests — ask the ones that hold every component at once
       before believing it. */
    if (!died) {
      try { execSync('npx vitest run src/test --reporter=dot', { cwd: ROOT, stdio: 'ignore', timeout: 600000 }) }
      catch { died = true }
    }
    writeFileSync(file, original)
    ;(died ? row.killed : row.survived).push(op.id)
    /* A mutant that used to die and now lives is a test that stopped biting —
       the one thing this check exists to catch, and it is louder than the score. */
    if (!died && prior.components[name]?.killed?.includes(op.id)) regressions.push(`${name}/${op.id}`)
    process.stdout.write(died ? '.' : `${RED}S${OFF}`)
  }
  results[name] = row
  process.stdout.write(' ')
}

const killed = Object.values(results).reduce((n, r) => n + r.killed.length, 0)
const survived = Object.values(results).reduce((n, r) => n + r.survived.length, 0)
const score = killed + survived ? Math.round((killed / (killed + survived)) * 100) : 0
console.log(`\n\n  ${killed + survived} mutant(s), ${killed} killed, ${survived} survived — ${BOLD}${score}%${OFF}`)

if (missing.length) {
  console.error(`\n${RED}✗ ${missing.length} tested component(s) have no baseline row:${OFF} ${missing.join(', ')}`)
  console.error(`  ${DIM}Run \`npm run mutate\` and commit mutation-baseline.json — a component nobody has tried to break is a component nobody has measured.${OFF}`)
  process.exit(1)
}
if (regressions.length) {
  console.error(`\n${RED}✗ ${regressions.length} mutant(s) that USED to be caught now survive:${OFF}`)
  for (const r of regressions) console.error(`    ${r}`)
  console.error(`  ${DIM}A test stopped biting. Fix the test, or record why the mutation is equivalent.${OFF}`)
  process.exit(1)
}

if (!check) {
  writeFileSync(BASELINE, JSON.stringify({ score, floor: score, killed, survived, components: results }, null, 2) + '\n')
  console.log(`${GREEN}✓ wrote mutation-baseline.json${OFF} ${DIM}floor ${score}%${OFF}`)
} else {
  if (score < FLOOR) {
    console.error(`\n${RED}✗ mutation score fell to ${score}%, under the ${FLOOR}% floor.${OFF}`)
    console.error(`  ${DIM}Add the tests that would have caught these, or re-set the floor deliberately with \`npm run mutate\`.${OFF}`)
    writeFileSync(BASELINE, JSON.stringify({ score, floor: FLOOR, killed, survived, components: results }, null, 2) + '\n')
    process.exit(1)
  }
  /* --check measured the changed ones; the file has to carry them forward or the
     next run measures them again and calls every survivor a regression. The
     floor rides along unchanged — only a full run moves it. */
  writeFileSync(BASELINE, JSON.stringify({ score, floor: FLOOR, killed, survived, components: results }, null, 2) + '\n')
  console.log(`${GREEN}✓ mutation score ${score}%${OFF} ${DIM}(floor ${FLOOR}%) — nothing that was caught has stopped being caught${OFF}`)
}
