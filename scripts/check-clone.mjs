#!/usr/bin/env node
/* Does a FRESH CLONE pass? Run by hand and in CI, never on every commit.
 *
 * The gate passing here proves the gate passes on THIS working tree, which is
 * not the claim the contract makes. A check can quietly depend on an untracked
 * file, a build output nobody committed, a warm cache, or a path that exists
 * only on the machine that wrote it. This package says something stronger than
 * that: it is standalone-complete, it carries its own lockfile and its own
 * config bases, and "a fresh clone of the published repo installs and passes
 * every gate step by itself" is written into the monorepo contract as the proof.
 * Until now that proof was a sentence somebody had to remember to perform.
 *
 * So: clone HEAD into a scratch directory, install from the lockfile with
 * nothing carried over, and run the gate there in CI mode. That is as close to
 * the CI machine as this laptop gets, and it is the half of "identically in CI
 * and locally" that can be proven without a remote.
 *
 * Two things it deliberately does NOT do. It does not copy node_modules — the
 * whole question is whether the lockfile is enough. And it does not run the
 * local-only steps, because pixel baselines rasterise per OS and a scratch
 * clone is not a different OS, so passing them there would prove nothing.
 *
 * POPULATION: derived — whatever git carries at HEAD for this package.
 *
 *   node scripts/check-clone.mjs             HEAD — what a stranger gets
 *   node scripts/check-clone.mjs --worktree  what you have now, uncommitted
 *   node scripts/check-clone.mjs --keep      leave the clone behind to look at
 *
 * HEAD is the default because it is the honest question, and it is also why the
 * first fix this check demanded could not be verified by it: the fix was not
 * committed yet, so the clone kept failing on the old code. `--worktree` takes
 * the tracked and the not-yet-ignored files as they are on disk, which is what
 * you want while fixing, and never what you want as proof.
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const ROOT = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const RESET = '\x1b[0m', RED = '\x1b[31m', GREEN = '\x1b[32m', DIM = '\x1b[2m'
const keep = process.argv.includes('--keep')

/* The package is a subdirectory of the monorepo here and the root of the
 * published repository there. `git archive` of this prefix is exactly what a
 * stranger gets, and it carries only tracked files — which is the point. */
const scratch = mkdtempSync(join(tmpdir(), 'ds-clone-'))
const run = (cmd, args, cwd, quiet = false) =>
  execFileSync(cmd, args, { cwd, stdio: quiet ? ['ignore', 'pipe', 'pipe'] : 'inherit', encoding: 'utf8' })

try {
  console.log(`${DIM}cloning ${process.argv.includes('--worktree') ? 'the working tree' : 'HEAD'} into ${scratch}${RESET}`)
  /* The package is a subdirectory here and the repository root in the published
   * copy, and the archive has to work in both: a pathspec is resolved against
   * the git root, so the prefix is computed from it rather than assumed. */
  const gitRoot = run('git', ['rev-parse', '--show-toplevel'], ROOT, true).trim()
  const prefix = ROOT === gitRoot ? '' : ROOT.slice(gitRoot.length + 1)
  const strip = prefix ? prefix.split('/').length : 0
  const worktree = process.argv.includes('--worktree')
  const stripArg = strip ? ` --strip-components=${strip}` : ''
  run('sh', ['-c', worktree
    ? `git ls-files -z --cached --others --exclude-standard -- ${prefix || '.'} | tar -cf - --null -T - | tar -x -C ${scratch}${stripArg}`
    : `git archive HEAD ${prefix || '.'} | tar -x -C ${scratch}${stripArg}`], gitRoot, true)
  if (!existsSync(join(scratch, 'package.json'))) {
    console.error(`${RED}✗ the archive carried no package.json — nothing is committed under ${prefix || 'the repository root'}${RESET}`)
    process.exit(1)
  }

  console.log(`${DIM}installing from the lockfile, nothing carried over${RESET}`)
  run('npm', ['ci', '--no-audit', '--no-fund'], scratch, true)

  console.log(`${DIM}running the CI gate in the clone${RESET}\n`)
  run('npm', ['run', 'check:ci'], scratch)
  console.log(`\n${GREEN}✓ a fresh clone of this package installs from its lockfile and passes the CI gate.${RESET}`)
} catch (err) {
  console.error(`\n${RED}✗ the clone does not stand on its own.${RESET}`)
  console.error(`  ${DIM}Whatever failed there is something this working tree has and a stranger does not:`)
  console.error(`  an untracked file, an uncommitted change, a build output, or a path off this machine.${RESET}`)
  if (err.stdout) console.error(String(err.stdout).slice(-4000))
  if (err.stderr) console.error(String(err.stderr).slice(-4000))
  process.exitCode = 1
} finally {
  if (keep) console.log(`${DIM}left behind: ${scratch}${RESET}`)
  else rmSync(scratch, { recursive: true, force: true })
}
