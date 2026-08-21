// Run the gate steps that the current changes can actually affect.
//
// `npm run check` stays the full gate and stays the thing that says "done" — it
// is what the commit hook and CI run, and it is the only run allowed to conclude
// anything. This is the other loop: while work is in progress, a CSS edit does
// not need the test suite, and a change inside one app does not need the other
// four re-rendered.
//
// The rule it follows is deliberately timid. It decides what to SKIP, never what
// to trust: anything it does not recognise — a config file, a lockfile, a script,
// a token file — falls back to the full gate. A fast check that guesses wrong is
// worse than a slow one, because the slow one is at least honest about what it
// verified.
import { execSync, spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const RESET = '\x1b[0m', GREEN = '\x1b[32m', DIM = '\x1b[2m', BOLD = '\x1b[1m', YELLOW = '\x1b[33m'

/**
 * What kind of file is this, in terms of what could break?
 *
 * `null` means "no idea" and forces the full gate.
 */
function kindOf(file) {
  if (/(^|\/)src\/.*\.(ts|tsx)$/.test(file)) return 'code'
  if (/(^|\/)(src|styles)\/.*\.css$/.test(file)) return 'style'
  if (/(^|\/)src\/locales\/.*\.json$/.test(file)) return 'copy'
  if (/\.(md|txt)$/.test(file)) return 'prose'
  if (/(^|\/)(visual|screens)\/.*\.png$/.test(file)) return 'baseline'
  return null
}

/* Which steps each kind can break. Ordered cheapest first so a failure lands
 * early: there is no point rendering 30 screens to find out that tsc is unhappy. */
const STEPS = {
  code: ['lint', 'lint:rules', 'typecheck:next', 'test:cov', 'build', 'audit:pages', 'screens'],
  style: ['lint:css', 'lint:rules', 'build', 'visual', 'audit:pages', 'screens'],
  copy: ['lint:rules', 'test:cov'],
  prose: ['check:skills'],
  baseline: [],
}

export function checkChanged({ pkgDir = process.cwd(), full = 'check' } = {}) {
  const scripts = JSON.parse(readFileSync(`${pkgDir}/package.json`, 'utf8')).scripts ?? {}
  const run = (cmd) => spawnSync('npm', ['run', '-s', cmd], { cwd: pkgDir, stdio: 'inherit' }).status === 0

  let changed = []
  try {
    const out = execSync('git status --porcelain=v1 --untracked-files=all', { cwd: pkgDir, encoding: 'utf8' })
    changed = out.split('\n').filter(Boolean).map((l) => l.slice(3).trim()).filter((f) => existsSync(`${pkgDir}/${f}`))
  } catch {
    console.log(`${YELLOW}!${RESET} not a git checkout — running the full gate.`)
    process.exit(run(full) ? 0 : 1)
  }

  if (changed.length === 0) {
    console.log(`${GREEN}✓${RESET} nothing changed in this package.`)
    return
  }

  const kinds = changed.map(kindOf)
  const unknown = changed.filter((_, i) => kinds[i] === null)
  if (unknown.length) {
    console.log(`${BOLD}Changed${RESET} ${changed.length} file(s), ${unknown.length} of a kind this cannot reason about:`)
    for (const f of unknown.slice(0, 5)) console.log(`  ${DIM}${f}${RESET}`)
    console.log(`\n  Running the full gate. ${DIM}A skipped check is only safe when the reason is known.${RESET}\n`)
    process.exit(run(full) ? 0 : 1)
  }

  const wanted = [...new Set(kinds.flatMap((k) => STEPS[k]))].filter((s) => scripts[s])
  console.log(`${BOLD}Changed${RESET} ${changed.length} file(s) ${DIM}(${[...new Set(kinds)].join(', ')})${RESET}`)
  console.log(`${DIM}  running: ${wanted.join(' ') || 'nothing'}${RESET}`)
  const skipped = Object.keys(scripts).filter((s) => STEPS.code.concat(STEPS.style).includes(s) && !wanted.includes(s))
  if (skipped.length) console.log(`${DIM}  skipped: ${skipped.join(' ')}${RESET}`)
  console.log('')

  for (const step of wanted) {
    if (!run(step)) {
      console.error(`\n\x1b[31m✗ ${step} failed.${RESET}`)
      process.exit(1)
    }
  }
  console.log(`\n${GREEN}✓ everything the changes could affect passes.${RESET}`)
  console.log(`${DIM}  This is not the full gate. Run \`npm run check\` before calling the work done.${RESET}`)
}
