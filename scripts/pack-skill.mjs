#!/usr/bin/env node
/**
 * The exported skill, as the two files a stranger can actually take.
 *
 * `gen:skill` writes `.agents/skills/design-system/`, which is the right shape for
 * a repository that HAS this package. Everyone else has to be able to get it in
 * one command, and a command that clones a monorepo they cannot see is not one.
 * So the release carries an archive of exactly that folder, unchanged, plus the
 * installer that puts it where each tool reads skills from.
 *
 * The archive root is the skill's own directory name, so unpacking it anywhere a
 * tool looks for skills lands `design-system/SKILL.md` and nothing else — which is
 * the whole contract the format asks of a skill folder.
 *
 * The names carry no version on purpose: `releases/latest/download/<name>` is the
 * URL people write in their notes, and a versioned asset name breaks it every
 * release. The version is inside, in the frontmatter, where a copy on somebody's
 * disk can still say what it is.
 *
 * It writes into `dist/`, which the browser build empties, so the archives are
 * built for the release rather than kept: `publish-ds.mjs --release` packs and
 * uploads in one pass, and nothing downstream reads a stale one.
 *
 *   npm run pack:skill
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, rmSync, existsSync, statSync, copyFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const SKILL = 'design-system'
const SRC = `${ROOT}/.agents/skills`
const OUT = `${ROOT}/dist/skill`

/* Never pack what the gate has not just proved fresh. An archive built from a
 * stale export is the one failure the generator's `--check` cannot catch, because
 * by then the file has left the repository. */
execFileSync(process.execPath, [`${ROOT}/scripts/gen-agent-skills.mjs`, '--check'], { stdio: 'inherit' })

if (!existsSync(`${SRC}/${SKILL}/SKILL.md`)) {
  console.error(`✗ ${SRC}/${SKILL}/SKILL.md is missing. Run \`npm run gen:skill\`.`)
  process.exit(1)
}

rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })

const run = (cmd, args) => execFileSync(cmd, args, { cwd: SRC, stdio: 'inherit' })
run('tar', ['-czf', `${OUT}/${SKILL}-skill.tar.gz`, SKILL])
/* -X drops the resource forks a mac would otherwise pack into somebody else's
 * skill folder as `__MACOSX/`. */
run('zip', ['-rqX', `${OUT}/${SKILL}-skill.zip`, SKILL])
copyFileSync(`${ROOT}/scripts/skill-install.sh`, `${OUT}/skill-install.sh`)

const kb = (p) => `${(statSync(p).size / 1024).toFixed(1)} KB`
console.log(`dist/skill: ${SKILL}-skill.tar.gz (${kb(`${OUT}/${SKILL}-skill.tar.gz`)}), ${SKILL}-skill.zip (${kb(`${OUT}/${SKILL}-skill.zip`)}), skill-install.sh`)
