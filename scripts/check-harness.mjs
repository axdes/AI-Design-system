/* The shared test harness is COPIED into every app, not imported: each app repo
 * must run its suite standalone, and a monorepo import breaks the clone. The
 * copy is safe only while it cannot drift — this check makes every copy
 * byte-identical to the canonical file, the same contract vendor-ds:check
 * enforces for the vendored design system.
 *
 * Canonical: src/test/harness/{polyfills.ts,a11y.ts}.
 * Copies:    apps/<name>/src/test/{polyfills.ts,a11y.ts}, where present.
 * A missing copy is fine (an app without UI tests carries none); a present
 * copy that differs fails the gate. Refresh a copy by copying the canonical
 * file over it. Exits clean when apps/ is absent (CI clones this package alone). */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const DS = join(HERE, '..')
const APPS = join(DS, '..', '..', 'apps')
const FILES = ['polyfills.ts', 'a11y.ts']

if (!existsSync(APPS)) {
  console.log('check-harness: no apps/ next to this checkout — nothing to compare.')
  process.exit(0)
}

const problems = []
let copies = 0

/* The same copy-with-a-check contract holds in the OTHER direction too: the
 * package carries local copies of the monorepo's tsconfig.base.json and
 * eslint.base.js so a standalone clone (github.com/axdes/AI-Design-system)
 * compiles and lints without a monorepo around it. The root files stay the
 * source — the apps vendor them from there — and these copies may not drift. */
for (const shared of ['tsconfig.base.json', 'eslint.base.js', '.stylelintrc.base.json']) {
  const rootFile = join(DS, '..', '..', shared.replace('.stylelintrc.base.json', '.stylelintrc.json'))
  const localFile = join(DS, shared)
  if (!existsSync(rootFile)) continue
  copies += 1
  if (readFileSync(localFile, 'utf8') !== readFileSync(rootFile, 'utf8')) {
    problems.push(`${shared} drifted from the monorepo root's — copy the root file over it`)
  }
}
for (const app of readdirSync(APPS)) {
  for (const file of FILES) {
    const copy = join(APPS, app, 'src', 'test', file)
    if (!existsSync(copy)) continue
    copies += 1
    const canonical = readFileSync(join(DS, 'src', 'test', 'harness', file), 'utf8')
    if (readFileSync(copy, 'utf8') !== canonical) {
      problems.push(`apps/${app}/src/test/${file} drifted from src/test/harness/${file}`)
    }
  }
}

if (problems.length) {
  console.error(`✗ ${problems.length} harness cop${problems.length === 1 ? 'y' : 'ies'} drifted:`)
  for (const p of problems) console.error('    ' + p)
  console.error('  Copy the canonical file over the copy (never the other way around).')
  process.exit(1)
}
console.log(`✓ ${copies} harness cop${copies === 1 ? 'y matches' : 'ies match'} the canonical files.`)
