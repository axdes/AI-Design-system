// Skills and agents are documentation that an agent OBEYS, so they rot the same way
// documentation does — except a stale skill is worse than stale docs: it actively
// steers the next session into a command that no longer exists or a path that moved.
//
// This checks the claims they make against the repository:
//   • every `npm run X` a skill mentions exists in some package.json
//   • every repo path a skill mentions exists on disk
//   • every SKILL.md / agent has the frontmatter the loader needs
//   • a description reads as a trigger (says when to use it), not as a title
//
// It found its own reason to exist: the March skills claimed `npm run check:tokens`,
// a command this design system never had.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const DS = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const ROOT = fileURLToPath(new URL('../../..', import.meta.url)).replace(/\/$/, '')
const SKILLS = `${ROOT}/.claude/skills`
const AGENTS = `${ROOT}/.claude/agents`

/* THE PACKAGE'S OWN skills, agents and contract travel to the published repo,
 * where this package IS the repository root. A path written `design-system/x`
 * resolves here and points at nothing there, and the reader who hits it is a
 * stranger following instructions on their first day. AGENTS.md states the rule
 * — every path is relative to the package root — and nothing enforced it: eleven
 * such paths shipped in the skills and the agent (2026-08-28).
 *
 * This runs BEFORE the standalone exit, because it is the standalone case it is
 * about. */
const PKG = `${ROOT}/packages/design-system`
const pkgRoot = existsSync(PKG) ? PKG : ROOT
const stale = []
/* Every markdown the package ships, not two folders: the first pass looked at
   `.claude` and `docs/contract` and missed `mcp/README.md`, which tells a
   stranger to register the server at a path that is not there. The working log
   is exempt — it narrates the monorepo on purpose and is stubbed on publish. */
const SKIP_MD = /(docs\/CHANGELOG-REVIEW\.md|node_modules|coverage|^r\/|visual\/)/
for (const dir of [pkgRoot]) {
  if (!existsSync(dir)) continue
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      const f = `${d}/${name}`
      if (statSync(f).isDirectory()) { if (!SKIP_MD.test(name)) walk(f); continue }
      if (!name.endsWith('.md')) continue
      if (SKIP_MD.test(f.replace(pkgRoot + '/', ''))) continue
      readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
        /* A mention that EXPLAINS the two layouts names them both; one that
           instructs names only the monorepo and breaks in the other. */
        if (!/packages\/design-system\//.test(line)) return
        if (/monorepo|published|repository root/i.test(line)) return
        stale.push(`${f.replace(ROOT + '/', '')}:${i + 1}  path is monorepo-only — write it relative to the package root, or name both layouts`)
      })
    }
  }
  walk(dir)
}
if (stale.length) {
  console.error(`\x1b[31m✗ ${stale.length} path(s) that resolve here and nowhere else:\x1b[0m`)
  for (const s of stale) console.error(`    ${s}`)
  process.exit(1)
}

/* Standalone clone (the published design-system repo): no monorepo above it,
 * so there are no monorepo skills, agents or app AGENTS.md files to check. */
if (!existsSync(`${ROOT}/apps`)) {
  console.log('check-skills: the package\'s own skills and contract check out; no monorepo around this checkout.')
  process.exit(0)
}

const problems = []
const note = (file, msg) => problems.push(`${file.replace(ROOT + '/', '')}: ${msg}`)

/* Every script name declared anywhere in the workspace. */
const scriptNames = new Set()
const pkgDirs = [ROOT, DS, ...readdirSync(`${ROOT}/apps`).map((a) => `${ROOT}/apps/${a}`)]
for (const dir of pkgDirs) {
  const p = `${dir}/package.json`
  if (!existsSync(p)) continue
  for (const s of Object.keys(JSON.parse(readFileSync(p, 'utf8')).scripts ?? {})) scriptNames.add(s)
}

/* Only these look like repository paths worth verifying. Anything else in backticks
 * is prose: an alias (@ds/Name), a placeholder (Name/, <id>.json), a file extension
 * list, or a binary somewhere on the machine. */
const REPO_PATH = /^(packages|apps|docs|src|styles|scripts|evals|visual|screen-specs|requests|\.claude|\.githooks|\.github)\//
const PLACEHOLDER = /[<>*]|(^|\/)(Name|<id>)(\/|\.|$)/

function checkDoc(file, body) {
  /* Frontmatter: the loader needs a description, and it doubles as the trigger. */
  const fm = body.match(/^---\n([\s\S]*?)\n---/)
  if (!fm) return note(file, 'no YAML frontmatter (the loader will skip it)')
  const desc = fm[1].match(/^description:\s*(.+)$/m)?.[1]
  if (!desc) return note(file, 'frontmatter has no `description` (the agent cannot know when to use it)')
  if (desc.length < 60) note(file, 'description is too short to work as a trigger; say when to use it, in the words a user would type')
  if (!/\buse when\b|\bwhen the user\b/i.test(desc)) {
    note(file, 'description does not say WHEN to use it ("Use when the user says ...") — it reads as a title, so it will not fire')
  }

  /* Claimed npm scripts must exist. */
  for (const m of body.matchAll(/npm run ([a-z0-9:-]+)/g)) {
    if (!scriptNames.has(m[1])) note(file, `claims \`npm run ${m[1]}\`, which no package.json defines`)
  }

  /* Claimed repo paths must exist. Only check things that look like real paths. */
  const seen = new Set()
  for (const m of body.matchAll(/`([^`\s]+\/[^`\s]*)`/g)) {
    const p = m[1].replace(/[.,)]$/, '')
    if (seen.has(p) || PLACEHOLDER.test(p) || !REPO_PATH.test(p)) continue
    seen.add(p)
    /* A path may be written relative to the repo root or to the DS package. */
    if (![`${ROOT}/${p}`, `${DS}/${p}`].some((c) => existsSync(c))) {
      note(file, `mentions \`${p}\`, which does not exist (moved or renamed?)`)
    }
  }
}

function walk(dir, isSkillDir) {
  if (!existsSync(dir)) return []
  const out = []
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = `${dir}/${e.name}`
    if (e.isDirectory() && isSkillDir) {
      if (existsSync(`${p}/SKILL.md`)) out.push(`${p}/SKILL.md`)
      else note(p, 'skill folder without a SKILL.md')
    } else if (e.isFile() && e.name.endsWith('.md') && !isSkillDir) out.push(p)
  }
  return out
}

const docs = [...walk(SKILLS, true), ...walk(AGENTS, false)]
for (const f of docs) {
  if (statSync(f).size === 0) { note(f, 'empty'); continue }
  checkDoc(f, readFileSync(f, 'utf8'))
}

/* AGENTS.md files are the same kind of artefact: an agent obeys them, and they rot
 * the same way. One app's contract spent months describing an atoms/molecules/
 * organisms tree the design system no longer had. Only the claims are checked here
 * (commands, paths) — frontmatter and triggers do not apply to them.
 *
 * The contract is AGENTS.md, the cross-tool name (Cursor, Copilot, Codex, Gemini
 * CLI, Windsurf, Zed read it natively). CLAUDE.md next to it is a pointer that
 * imports it, so it carries no claims of its own and is checked for one thing:
 * that it still points at a contract that exists. */
const contracts = [
  `${ROOT}/AGENTS.md`,
  `${DS}/AGENTS.md`,
  ...readdirSync(`${ROOT}/apps`).map((a) => `${ROOT}/apps/${a}/AGENTS.md`),
].filter((f) => existsSync(f))

for (const f of contracts) {
  const pointer = f.replace(/AGENTS\.md$/, 'CLAUDE.md')
  if (!existsSync(pointer)) {
    note(pointer, 'no CLAUDE.md pointing at AGENTS.md, so Claude Code reads no contract here')
  } else if (!/^@AGENTS\.md$/m.test(readFileSync(pointer, 'utf8'))) {
    note(pointer, 'does not import AGENTS.md (a bare `@AGENTS.md` line) — Claude Code and the other tools would read different contracts')
  }
  const body = readFileSync(f, 'utf8')
  /* A package's contract writes paths relative to its own folder, so that is a
   * third place a claimed path may legitimately live. */
  const own = f.slice(0, f.lastIndexOf('/'))
  for (const m of body.matchAll(/npm run ([a-z0-9:-]+)/g)) {
    if (!scriptNames.has(m[1])) note(f, `claims \`npm run ${m[1]}\`, which no package.json defines`)
  }
  const seen = new Set()
  for (const m of body.matchAll(/`([^`\s]+\/[^`\s]*)`/g)) {
    const p = m[1].replace(/[.,)]$/, '')
    if (seen.has(p) || PLACEHOLDER.test(p) || !REPO_PATH.test(p)) continue
    seen.add(p)
    if (![`${ROOT}/${p}`, `${DS}/${p}`, `${own}/${p}`].some((c) => existsSync(c))) {
      note(f, `mentions \`${p}\`, which does not exist (moved or renamed?)`)
    }
  }
}

/* Counted claims. "73 components, 4 blocks" is the kind of sentence that reads as
 * authoritative and rots the moment somebody adds a component: an agent told the
 * system has 73 components will not go looking for the 74th. Commands and paths
 * were already checked; a number is just as much a claim about the repository. */
const countDirs = (dir) =>
  readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).length
const REAL = {
  components: countDirs(`${DS}/src/components`),
  blocks: countDirs(`${DS}/src/blocks`),
}
for (const f of [...walk(SKILLS, true), ...walk(AGENTS, false), ...contracts]) {
  const body = readFileSync(f, 'utf8')
  for (const m of body.matchAll(/(\d+)\s+(components|blocks)\b/g)) {
    const claimed = Number(m[1])
    const real = REAL[m[2]]
    if (claimed !== real) note(f, `claims ${claimed} ${m[2]}, there are ${real}`)
  }
}

const skillCount = walk(SKILLS, true).length
const agentCount = walk(AGENTS, false).length

if (problems.length) {
  console.error(`\n\x1b[31m✗ ${problems.length} problem(s) in project skills/agents\x1b[0m\n`)
  for (const p of problems) console.error(`  ${p}`)
  console.error('\nA skill that names a command or a path that does not exist steers the next session wrong.\n')
  process.exit(1)
}

console.log(`\x1b[32m✓ project skills and agents check out\x1b[0m (${skillCount} skills, ${agentCount} agents, ${contracts.length} AGENTS.md: commands exist, paths exist, descriptions trigger)`)
