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
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync, unlinkSync } from 'node:fs'
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

/* True when index `i` sits inside a // line comment or a /* block comment. A
   character scan rather than a regex: the file is small, and a regex that tries
   to know about strings and comments at once is how this goes wrong. */
function inComment(src, i) {
  let block = false, line = false
  for (let p = 0; p < i; p++) {
    if (line) { if (src[p] === '\n') line = false; continue }
    if (block) { if (src[p] === '*' && src[p + 1] === '/') { block = false; p++ } ; continue }
    if (src[p] === '/' && src[p + 1] === '*') { block = true; p++ }
    else if (src[p] === '/' && src[p + 1] === '/') { line = true; p++ }
  }
  return block || line
}

/** Apply `op` to the first match that is real code. null when there is none. */
function mutateOutsideComments(src, op) {
  const re = new RegExp(op.re.source, op.re.flags.includes('g') ? op.re.flags : `${op.re.flags}g`)
  for (const m of src.matchAll(re)) {
    if (inComment(src, m.index)) continue
    const head = src.slice(0, m.index)
    const tail = src.slice(m.index + m[0].length)
    return head + m[0].replace(op.re, op.to) + tail
  }
  return null
}

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

/* A RUN THAT DIES MID-MUTANT MUST NOT LEAVE THE MUTANT BEHIND.
 *
 * The loop writes a broken version of a component, runs the suite, and writes
 * the original back. Kill it in between — a timeout, Ctrl-C, a closed pipe —
 * and the working tree keeps the break: a widened guard, an `&&` turned into
 * `||`, sitting in the source with nothing to say it is there. A full pass is
 * fourteen minutes, so being interrupted is the NORMAL case, and the next thing
 * anybody runs then measures the mutant instead of the code (2026-08-29).
 *
 * A SIGNAL HANDLER IS NOT ENOUGH, and that was measured rather than assumed:
 * the loop spends all its time inside a blocking `execSync`, so a handler
 * registered on SIGTERM never gets a turn before the process is gone — killed
 * mid-run with one in place, the mutated file stayed mutated.
 *
 * So the original goes to a file on disk before the mutation is written, and is
 * removed once it has been put back. Anything left behind is a run that died,
 * and the next run sweeps it before it measures anything. That survives a
 * SIGKILL, which no handler can. Same guarantee, and the same reason, as the
 * `.gaterb` backups in gate-redteam.mjs. */
const BAK = '.mutbak'

const sweep = () => {
  let found = 0
  for (const name of readdirSync(`${ROOT}/src/components`)) {
    const dir = `${ROOT}/src/components/${name}`
    /* src/components holds a few JSON files beside the folders. */
    if (!statSync(dir).isDirectory()) continue
    for (const f of readdirSync(dir)) {
      if (!f.endsWith(BAK)) continue
      const live = `${dir}/${f.slice(0, -BAK.length)}`
      writeFileSync(live, readFileSync(`${dir}/${f}`, 'utf8'))
      unlinkSync(`${dir}/${f}`)
      console.error(`${RED}restored ${live.replace(`${ROOT}/`, '')}${OFF} ${DIM}— a previous run was interrupted mid-mutant${OFF}`)
      found++
    }
  }
  return found
}
if (sweep()) console.error('')

const results = { ...prior.components }
const regressions = []
for (const name of todo) {
  const file = `${ROOT}/src/components/${name}/${name}.tsx`
  const original = readFileSync(file, 'utf8')
  const row = { hash: digest(name), killed: [], survived: [] }
  for (const op of OPS) {
    /* A MUTANT IN A COMMENT CANNOT BE KILLED, AND COUNTING IT LOWERS THE SCORE
     * FOR NOTHING. `invert-comparison` matched ` > ` inside three JSDoc blocks —
     * a note about `.btn > .icon` in Button and MenuButton, and one about ARIA
     * grid > row > gridcell in Calendar — and each one was recorded as a
     * survivor no test could ever have caught (2026-08-29). The operator now
     * skips past a match that lands in a comment and mutates the next real one,
     * so an operator still applies wherever it genuinely can. */
    const mutated = mutateOutsideComments(original, op)
    if (mutated === null || mutated === original) continue
    writeFileSync(`${file}${BAK}`, original)
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
    unlinkSync(`${file}${BAK}`)
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
