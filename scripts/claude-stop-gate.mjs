// Claude Code STOP hook — enforces "the linters pass before a turn ends", without
// relying on memory. Fires when the agent finishes a turn and BLOCKS finishing
// (exit 2 → message fed back to the session) if anything fails, so a turn can
// never end with broken rules.
//
// Scope is deliberately the two packages below, not all five. Every app now has
// the same `lint:rules`, but running five packages' linters on every single turn
// costs ~20s a turn for coverage that is already there: the PostToolUse edit hook
// lints an app the moment a file in it changes, which catches the same breakage
// earlier and only pays for the app actually being edited.
//
// Build, tests and the registry check are enforced separately by the git
// pre-commit hook (.githooks/pre-commit → npm run check). Kept fast here (no
// build, no vitest) so it is cheap to run every turn.
import { execSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')

/* This package plus whatever products sit beside it. Read from the folder, never
 * listed: a hardcoded list goes stale the day a product is added, and a published
 * design system has no business naming its owner's projects. */
const APPS = `${ROOT}/../../apps`
const PACKAGES = [
  { name: 'design system', dir: ROOT },
  ...(existsSync(APPS) ? readdirSync(APPS) : [])
    .map((name) => ({ name, dir: `${APPS}/${name}` }))
    .filter(({ dir }) => existsSync(`${dir}/package.json`)),
]

let failed = false
for (const { name, dir } of PACKAGES) {
  if (!existsSync(`${dir}/package.json`)) continue
  try {
    execSync('npm run -s lint && npm run -s lint:css && npm run -s lint:rules', {
      cwd: dir,
      stdio: ['ignore', 'inherit', 'inherit'],
    })
  } catch {
    process.stderr.write(`\n\x1b[31m✗ ${name}: gate FAILED\x1b[0m\n`)
    failed = true
  }
}

if (failed) {
  process.stderr.write(
    '\n\x1b[31m✗ Stop gate FAILED\x1b[0m — fix the linters before finishing (ESLint + Stylelint + lint-rules). Do not leave the project red.\n',
  )
  process.exit(2) // block stop → the session must fix
}
process.exit(0) // clean → the turn may end
