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
  /* EMPTY, and that is the state to keep it in. Two entries lived here for the
   * react-router RSC advisory and left on 2026-09-02: npm stopped reporting them,
   * and an exception nobody can still see the finding for hides the next real one.
   * fast-uri went the same day and the same way as in August — `npm audit fix`
   * lifted it 3.1.5 -> 3.1.7 (four advisories, all in URI parsing reached through
   * ajv in stryker and stylelint) without touching a major, so it is fixed rather
   * than excused. An entry here is a decision with a reason and a recheck
   * condition, never a way to get a commit through. */
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
