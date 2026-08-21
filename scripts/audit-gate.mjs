// Dependencies: advisories AND held-back majors, with a decision recorded for each.
//
// `npm audit` alone is not a gate: it reports findings whose only offered "fix" is
// a downgrade, so a team either runs `--force` and wrecks the toolchain, or stops
// reading it. Both end with nobody noticing the advisory that DOES matter.
//
// So this does what the linter does with its ALLOW map: every known finding needs
// a written reason and a condition that would make it real again. Anything not on
// the list fails the gate. Shrink the list; never widen it to clear red.
//
// Run: node scripts/audit-gate.mjs   (from the repo root or this package)
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../../..', import.meta.url)).replace(/\/$/, '')

/* Each entry: why it does not reach this code, and what would change that.
 * Reviewed 2026-07-28. */
const ACCEPTED = {
  'react-router': {
    advisory: 'RSC Mode CSRF Bypass Allows Action Execution Before 400 Response',
    why:
      'The vector is React Router in RSC mode: a server action executing before the ' +
      'request is rejected. Every app here is a client-only SPA on <BrowserRouter> / ' +
      '<HashRouter> with <Routes>. No createBrowserRouter, no RouterProvider, no ' +
      'loaders or actions, and none of @react-router/{node,serve,dev} is installed, ' +
      'so there is no server to execute an action on.',
    fixIsADowngrade: 'npm offers 7.11.0; we are on 7.18.2. The forward fix is >=8.3.0, which is not published (latest is 7.18.2).',
    recheck: 'When react-router 8.3+ ships, upgrade and delete this entry.',
  },
  'react-router-dom': { sameAs: 'react-router' },
  /* The eslint -> minimatch -> brace-expansion chain and fast-uri (via ajv, in
   * @stryker-mutator/core and stylelint -> table) were both accepted here and are
   * both gone as of 2026-08-04: `npm audit fix` lifted brace-expansion to 5.0.9 and
   * fast-uri to 3.1.5 without touching a major, so the exceptions were deleted
   * rather than re-dated. A stale exception hides the next real one. */
}

let report
try {
  report = JSON.parse(execSync('npm audit --json', { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }))
} catch (e) {
  // npm audit exits non-zero when it finds anything; the JSON is still on stdout.
  try { report = JSON.parse(e.stdout) } catch {
    console.error('\x1b[31m✗ could not run npm audit\x1b[0m')
    process.exit(1)
  }
}

const found = Object.entries(report.vulnerabilities ?? {})
  .filter(([, v]) => ['high', 'critical'].includes(v.severity))
  .map(([name]) => name)

const unknown = found.filter((n) => !ACCEPTED[n])
const stale = Object.keys(ACCEPTED).filter((n) => !found.includes(n))

console.log('\x1b[1mDependency advisories\x1b[0m\n')
for (const name of found) {
  const e = ACCEPTED[name]
  if (!e) { console.log(`  \x1b[31m✗ ${name} — NEW, no decision recorded\x1b[0m`); continue }
  const head = e.sameAs ? `same finding as ${e.sameAs}` : e.advisory
  console.log(`  \x1b[32m✓\x1b[0m ${name} — accepted: ${head}`)
}
if (stale.length) {
  console.log(`\n  \x1b[33m! ${stale.length} entr(ies) no longer reported: ${stale.join(', ')}\x1b[0m`)
  console.log('    Delete them from ACCEPTED — a stale exception hides the next real one.')
}

/* Majors we are deliberately NOT on. Same rule as above: a version is allowed to
 * lag only with a reason and a condition that would end the lag. Everything else
 * should simply be updated. Reviewed 2026-07-28. */
const HELD_BACK = {
  typescript: {
    on: '5.9.3 for the build, 7.0 preview as a second checker', latest: '7.x',
    why:
      'typescript-eslint declares `typescript: ">=4.8.4 <6.1.0"` — including its ' +
      'canary — so making TS 7 THE compiler would trade every type-aware lint rule ' +
      'for a version number. Instead both run: tsc 5.9 emits and feeds the linter, ' +
      'and `npm run typecheck:next` (@typescript/native-preview, the Go compiler) ' +
      'checks the same project in every package as part of the gate. It is roughly ' +
      '7x faster and it already caught something 5.9 cannot report: TS 7 removed ' +
      '`baseUrl`, which one product\'s tsconfig still set.',
    recheck:
      'When typescript-eslint widens its peer range past 6, promote the preview to ' +
      'THE compiler, drop this entry and fold typecheck:next back into build.',
  },
  '@deepgram/sdk': {
    on: '3.13.0', latest: '5.x',
    why:
      'v5 is a different SDK, not a newer one: createClient and ' +
      'LiveTranscriptionEvents are gone (verified against the published package). ' +
      'server/src/deepgram.mjs is written against the v3 live API, and the only ' +
      'honest way to verify a rewrite is a real recording, which costs credits.',
    recheck: 'Scheduled work: port deepgram.mjs to the v5 client, then verify with one live recording.',
  },
  /* Two packages where `npm outdated` is misleading: the installed version is
   * NEWER than whatever the `latest` dist-tag currently points at, so "update to
   * latest" would move backwards. Left here so nobody re-discovers it. */
  vitest: {
    on: '4.1.10', latest: '3.2.7 on the `latest` tag',
    why: 'We are AHEAD of the latest tag. Updating to it would be a downgrade.',
    recheck: 'None needed; re-read when the 4.x line becomes `latest`.',
  },
  jsdom: {
    on: '30.0.1', latest: '27.0.1 on the `latest` tag',
    why: 'Same as vitest: installed is ahead of the tag.',
    recheck: 'None needed.',
  },
}

console.log('\n\x1b[1mMajors held back on purpose\x1b[0m\n')
for (const [name, e] of Object.entries(HELD_BACK)) {
  console.log(`  \x1b[32m✓\x1b[0m ${name} — on ${e.on}, latest ${e.latest}`)
}

if (unknown.length) {
  console.error(`\n\x1b[31m✗ ${unknown.length} advisory/ies with no recorded decision: ${unknown.join(', ')}\x1b[0m`)
  console.error('  Read it, decide, and either fix it or add an entry with a reason and a recheck condition.')
  process.exit(1)
}
console.log(`\n\x1b[32m✓ ${found.length} known advisory/ies and ${Object.keys(HELD_BACK).length} held-back majors, each with a written decision.\x1b[0m`)
