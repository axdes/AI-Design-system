/* Scan for anything that must not leave this machine: live-looking API keys,
 * tokens, private keys and real email addresses. Prints every hit and exits
 * non-zero.
 *
 * Written while packaging the monorepo for hand-off, where it found five real
 * addresses in code comments and a changelog. Run it against the STAGED copy AND
 * against the extracted archive: an `npm install` in between regenerated a .env
 * that the first scan could not have seen.
 *
 * TWO MODES, because "is there a secret here" has two different answers:
 *
 *   --tracked (default)  only files git carries, across the monorepo and each
 *                        app's own repository. This is the gate. A live key in
 *                        server/.env is CORRECT — that is where keys belong —
 *                        so scanning the working tree would keep the gate red
 *                        forever and everyone would learn to ignore it. What is
 *                        never acceptable is a key that git is versioning, and
 *                        that is exactly what this mode found: transcript had
 *                        server/.env committed with a live Anthropic key.
 *
 *   --all <dir>          every file under a directory, ignore rules and all.
 *                        This is the SHARE check: an archive carries whatever
 *                        is on disk, so .gitignore means nothing there.
 *
 * Usage:
 *   node scripts/secret-scan.mjs                 # tracked files (the gate)
 *   node scripts/secret-scan.mjs --all <dir>     # a staged copy / an archive */
import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const argv = process.argv.slice(2)
const allMode = argv.includes('--all')
const MONOREPO = fileURLToPath(new URL('../../..', import.meta.url)).replace(/\/$/, '')
const root = allMode ? argv[argv.indexOf('--all') + 1] : MONOREPO
if (!root) {
  console.error('secret-scan: --all needs a directory')
  process.exit(1)
}
const SKIP = new Set(['node_modules', '.git', 'dist', 'coverage'])
const BIN = /\.(png|jpg|jpeg|gif|svg|ico|woff2?|ttf|mp3|wav|zip|pdf|xlsx)$/i

const PATTERNS = [
  [/\b(sk|pk)-[A-Za-z0-9_-]{20,}/g, 'API key (sk-/pk-)'],
  [/\bghp_[A-Za-z0-9]{20,}/g, 'GitHub token'],
  [/\bxox[baprs]-[A-Za-z0-9-]{10,}/g, 'Slack token'],
  [/\bAIza[0-9A-Za-z_-]{30,}/g, 'Google API key'],
  [/\b2[a-zA-Z0-9]{25,}\b(?=.*NGROK|.*ngrok)/gi, 'ngrok token'],
  [/\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/g, 'JWT'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/g, 'private key'],
  /* A real address, not a placeholder: First_Last@ / First_Middle_Last@ document
   * the UPN convention the code actually derives, and *.example is reserved for
   * docs. Anything else that looks like a person is a person. */
  [/(?<![A-Za-z0-9._%+-])(?!First_Last@|First_Middle_Last@)[A-Za-z0-9._%+-]+@(?!example\.|test\.)[A-Za-z0-9.-]+\.(com|org|net|io|ru|by)\b/g, 'email address'],
]

/* Reviewed and deliberately kept. Same rule as the linter's ALLOW and the audit
 * gate: an exception needs a reason, or the next real hit hides behind it.
 * Keys and tokens are NEVER listed here — only addresses, and only ones that are
 * either nobody's personal data (a distribution list, the owner's own) or a
 * PUBLISHED contact point of something in this repository: an address a product
 * writes to on purpose is already shown to everyone who uses it, so a scan
 * cannot be what protects it. Reviewed 2026-08-07. */
const ACCEPTED = [
  {
    match: 'axdess@gmail.com',
    why: "The repository owner's own address, and the changelog entry is ABOUT it: " +
      'commits were authored under personal mail, which is a decision worth keeping ' +
      'legible. Not someone else\'s data to leak.',
  },
]

/* Exceptions that describe the APPS (their published contact points) live at
 * the monorepo root, next to the repositories they are about. A standalone
 * clone of this package has neither the file nor the matches it covers. */
const EXTRA_ACCEPTED = join(MONOREPO, 'scripts', 'secret-scan.accepted.mjs')
if (existsSync(EXTRA_ACCEPTED)) {
  ACCEPTED.push(...(await import(EXTRA_ACCEPTED)).ACCEPTED)
}

const hits = []
const scan = (path, label) => {
  if (BIN.test(path)) return
  let text
  try { text = readFileSync(path, 'utf8') } catch { return }
  for (const [re, kind] of PATTERNS) {
    for (const m of text.matchAll(re)) {
      if (ACCEPTED.some((a) => a.match === m[0])) continue
      const line = text.slice(0, m.index).split('\n').length
      hits.push({ file: label, line, label: kind, sample: m[0].slice(0, 12) + '…' })
    }
  }
}

const walk = (d) => {
  for (const e of readdirSync(d)) {
    if (SKIP.has(e)) continue
    const p = join(d, e)
    if (statSync(p).isDirectory()) { walk(p); continue }
    scan(p, p.replace(root + '/', ''))
  }
}

/* The apps carry their OWN git repositories and the monorepo excludes /apps/,
 * so one `git ls-files` at the root would miss every app file. Each repository
 * is asked separately, which is also how the exposure actually works: an app is
 * cloned on its own. */
const repos = [MONOREPO, ...['salim', 'workshops', 'airun', 'transcript']
  .map((a) => join(MONOREPO, 'apps', a))
  .filter((d) => existsSync(join(d, '.git')))]

if (allMode) {
  walk(root)
} else {
  for (const repo of repos) {
    let files
    try {
      files = execFileSync('git', ['ls-files', '-z'], { cwd: repo, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
        .split('\0').filter(Boolean)
    } catch { continue }
    const rel = repo.replace(MONOREPO + '/', '')
    for (const f of files) scan(join(repo, f), repo === MONOREPO ? f : `${rel}/${f}`)
  }
}

const where = allMode ? `the tree at ${root}` : `${repos.length} tracked repositor${repos.length === 1 ? 'y' : 'ies'}`
if (!hits.length) { console.log(`✓ no secrets or real addresses in ${where}`); process.exit(0) }
console.log(`Scanned ${where}.`)
const byLabel = {}
for (const h of hits) (byLabel[h.label] ??= []).push(h)
for (const [label, list] of Object.entries(byLabel)) {
  console.log(`\n✗ ${label} — ${list.length} hit(s)`)
  for (const h of list.slice(0, 12)) console.log(`    ${h.file}:${h.line}  ${h.sample}`)
  if (list.length > 12) console.log(`    … +${list.length - 12} more`)
}
process.exit(1)
