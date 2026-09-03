/* The installer is the one file here that a stranger runs, and the only one no
 * other check touches: the gate proves the export is fresh and true, and proves
 * nothing about the twenty lines that put it on somebody's disk.
 *
 * So this runs it, from a `file://` archive built the way `pack:skill` builds the
 * real one. What it asserts is exactly what the acceptance list in
 * docs/skill-package-draft.md asks of the install: the skill lands under its own
 * name, it carries its references, it says which version it is, and a second
 * install REPLACES the first rather than merging into it — a generated skill that
 * merged would keep references the current SKILL.md no longer names.
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

/* Paths relative to the package root, not derived from import.meta.url: this
 * suite runs under jsdom through Vite, where import.meta.url is a `/@fs/` URL and
 * every path built from it points at nothing. vitest runs with the package as its
 * working directory — the same reasoning as mcp/server.test.mjs. */
const ROOT = process.cwd()
const INSTALLER = `${ROOT}/scripts/skill-install.sh`

/* curl is what the installer downloads with, on purpose: it is the one thing a
 * `curl … | sh` reader is guaranteed to have. A build image without it cannot run
 * this test, and that is not a reason to fail the gate. */
const hasCurl = (() => {
  try { execFileSync('curl', ['--version'], { stdio: 'ignore' }); return true } catch { return false }
})()

let work
let archive

beforeAll(() => {
  work = mkdtempSync(`${tmpdir()}/skill-install-`)
  archive = `${work}/design-system-skill.tar.gz`
  execFileSync('tar', ['-czf', archive, 'design-system'], { cwd: `${ROOT}/.agents/skills` })
})

afterAll(() => rmSync(work, { recursive: true, force: true }))

const install = (dest, args = []) =>
  execFileSync('sh', [INSTALLER, '--url', `file://${archive}`, '--dest', dest, ...args], { encoding: 'utf8' })

describe.skipIf(!hasCurl)('skill-install.sh', () => {
  it('lands the skill under its own name, with its references and its version', () => {
    const dest = `${work}/dest`
    const out = install(dest)

    expect(existsSync(`${dest}/design-system/SKILL.md`)).toBe(true)
    expect(existsSync(`${dest}/design-system/references/components/component-index.md`)).toBe(true)
    expect(out).toMatch(/skill-v\d+\.\d+\.\d+/)
    expect(out).toContain(`${dest}/design-system`)
  })

  it('replaces an older copy instead of merging into it', () => {
    const dest = `${work}/replaced`
    install(dest)
    mkdirSync(`${dest}/design-system/references/guides`, { recursive: true })
    writeFileSync(`${dest}/design-system/references/guides/gone.md`, 'a reference the export stopped shipping')

    install(dest)

    expect(existsSync(`${dest}/design-system/references/guides/gone.md`)).toBe(false)
    expect(existsSync(`${dest}/design-system/SKILL.md`)).toBe(true)
  })

  it('says where to look when the asset is not there, rather than leaving an empty folder', () => {
    const dest = `${work}/missing`
    let failed
    try {
      execFileSync('sh', [INSTALLER, '--url', `file://${work}/nothing.tar.gz`, '--dest', dest], { encoding: 'utf8', stdio: 'pipe' })
    } catch (e) {
      failed = e
    }
    expect(failed?.status).toBe(1)
    expect(String(failed?.stderr)).toContain('gh release list')
    expect(existsSync(`${dest}/design-system`)).toBe(false)
  })
})
