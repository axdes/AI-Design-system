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
/* THREE LEVELS UP IS THE MONOREPO ROOT HERE AND SOMEBODY ELSE'S DIRECTORY THERE.
 *
 * In this checkout the script sits at packages/design-system/scripts/, so
 * `../../..` is the monorepo. In the published copy the package IS the
 * repository, the script sits at scripts/, and the same expression lands one
 * level ABOVE the clone — whatever happens to be there. Found by
 * `npm run check:clone` on its first run, 2026-09-02: in a scratch clone it
 * walked the system temp directory looking for markdown and died on a macOS
 * file it may not stat. The check was reading a tree it had no business in, and
 * the whole gate went red for a reason that was not about this package.
 *
 * So the monorepo is DETECTED rather than assumed, and standalone means the
 * package root is the only root there is. */
const ABOVE = fileURLToPath(new URL('../../..', import.meta.url)).replace(/\/$/, '')
const inMonorepo = existsSync(`${ABOVE}/packages/design-system`) && existsSync(`${ABOVE}/apps`)
const ROOT = inMonorepo ? ABOVE : DS
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
const pkgRoot = DS
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

const problems = []
const note = (file, msg) => problems.push(`${file.replace(ROOT + '/', '')}: ${msg}`)

/* Every script name declared anywhere in the workspace — and, in a standalone
 * clone, the package's own, which is then the only package.json there is. */
const scriptNames = new Set()
const apps = existsSync(`${ROOT}/apps`) ? readdirSync(`${ROOT}/apps`).map((a) => `${ROOT}/apps/${a}`) : []
const pkgDirs = [ROOT, DS, pkgRoot, ...apps]
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

/* A skill in `.claude/` may name any command the workspace defines: its reader is
 * standing in the workspace. The EXPORTED skill may not — its reader has this
 * package and nothing else, so `npm run X` there has to be a script this package
 * itself declares. The two lists were one until an export claimed `check:tokens`,
 * which seven apps define and this package never has. */
const pkgScripts = new Set(
  Object.keys(JSON.parse(readFileSync(`${pkgRoot}/package.json`, 'utf8')).scripts ?? {}),
)

function checkDoc(file, body, { scripts = scriptNames, roots = [ROOT, DS] } = {}) {
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
    if (!scripts.has(m[1])) {
      note(file, `claims \`npm run ${m[1]}\`, which ${scripts === scriptNames ? 'no package.json defines' : 'this package does not define — the reader of this file has no other'}`)
    }
  }

  /* Claimed repo paths must exist. Only check things that look like real paths. */
  const seen = new Set()
  for (const m of body.matchAll(/`([^`\s]+\/[^`\s]*)`/g)) {
    const p = m[1].replace(/[.,)]$/, '')
    if (seen.has(p) || PLACEHOLDER.test(p) || !REPO_PATH.test(p)) continue
    seen.add(p)
    /* A path may be written relative to the repo root or to the DS package. */
    if (!roots.some((r) => existsSync(`${r}/${p}`))) {
      note(file, `mentions \`${p}\`, which does not exist (moved or renamed?)`)
    }
  }
}

/* Counted claims. "73 components, 4 blocks" is the kind of sentence that reads as
 * authoritative and rots the moment somebody adds a component: an agent told the
 * system has 73 components will not go looking for the 74th. Commands and paths
 * are claims about the repository; a number is one too. */
const countDirs = (dir) =>
  readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).length
const REAL = {
  components: countDirs(`${DS}/src/components`),
  blocks: countDirs(`${DS}/src/blocks`),
}
function checkCounts(files) {
  for (const f of files) {
    const body = readFileSync(f, 'utf8')
    for (const m of body.matchAll(/(\d+)\s+(components|blocks)\b/g)) {
      const claimed = Number(m[1])
      const real = REAL[m[2]]
      if (claimed !== real) note(f, `claims ${claimed} ${m[2]}, there are ${real}`)
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

/* THE EXPORTED SKILL — `.agents/skills/`, written by gen-agent-skills.mjs for an
 * agent working WITH this package in somebody else's repository.
 *
 * Generated is not the same as true. Every command it names and every number it
 * prints is a claim about a repository the reader has and this checkout is not,
 * and it is the one document here whose reader cannot ask anybody what was meant.
 * So it is checked like a hand-written skill — and it is checked in a standalone
 * clone too, because a standalone clone is the only place it is ever read.
 *
 * Its own links are the fourth acceptance point of docs/skill-package-draft.md:
 * a `references/…` path that resolves in the monorepo and nowhere else is exactly
 * the failure this file was written for, one directory over. */
const exported = walk(`${pkgRoot}/.agents/skills`, true)
for (const f of exported) {
  const body = readFileSync(f, 'utf8')
  checkDoc(f, body, { scripts: pkgScripts, roots: [pkgRoot] })
  const dir = f.slice(0, f.lastIndexOf('/'))
  const seen = new Set()
  for (const m of body.matchAll(/`([^`\s]+\/[^`\s]*)`/g)) {
    const rel = m[1].replace(/[.,)]$/, '')
    if (seen.has(rel) || PLACEHOLDER.test(rel) || !rel.startsWith('references/')) continue
    seen.add(rel)
    if (!existsSync(`${dir}/${rel}`)) note(f, `points at \`${rel}\`, which is not in the exported skill`)
  }
}
checkCounts(exported)

/* Standalone clone (the published design-system repo): no monorepo above it, so
 * there are no monorepo skills, agents or app AGENTS.md files left to check. */
if (!existsSync(`${ROOT}/apps`)) {
  if (problems.length) {
    console.error(`\n\x1b[31m✗ ${problems.length} problem(s) in the exported skill\x1b[0m\n`)
    for (const p of problems) console.error(`  ${p}`)
    process.exit(1)
  }
  console.log(`check-skills: the package's own skills and contract check out (${exported.length} exported skill(s)); no monorepo around this checkout.`)
  process.exit(0)
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

checkCounts([...walk(SKILLS, true), ...walk(AGENTS, false), ...contracts])

const skillCount = walk(SKILLS, true).length
const agentCount = walk(AGENTS, false).length

if (problems.length) {
  console.error(`\n\x1b[31m✗ ${problems.length} problem(s) in project skills/agents\x1b[0m\n`)
  for (const p of problems) console.error(`  ${p}`)
  console.error('\nA skill that names a command or a path that does not exist steers the next session wrong.\n')
  process.exit(1)
}

console.log(`\x1b[32m✓ project skills and agents check out\x1b[0m (${skillCount} skills, ${agentCount} agents, ${exported.length} exported, ${contracts.length} AGENTS.md: commands exist, paths exist, descriptions trigger)`)
