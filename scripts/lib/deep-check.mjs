// Does this file compile, and does it mount without accessibility violations.
//
// Measured 2026-08-02 over 27 agent runs: `compiles` broke 13 times and
// `renders` 9, against 13 for everything the static registry checks catch put
// together. Two thirds of the loss is in the two things no amount of reading the
// registry can answer — and until now the only way to ask them was the full
// gate, which nobody runs between edits.
//
// The eval runner has done exactly this since it was written. This is that code,
// moved so `npm run verify -- --deep` and the runner share ONE implementation
// rather than the two-that-drift this repository keeps finding.
//
// Two entry points, because there are two situations and they are not the same:
//
//   deepCheckInPlace  a file that already lives in the project. Checked where it
//                     is, or its relative imports stop resolving.
//   deepCheck         an eval candidate, which exists only in memory and has to
//                     be written somewhere before tsc and vitest can see it.
//
// Both need the project's own tsconfig and vitest setup for the `@ds` aliases and
// jsdom, so both run from the package root. The scratch directory is per process:
// two of these at once used to delete each other's files.
import { execSync, spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'

/* A file that already lives in the project is checked WHERE IT LIVES.
 *
 * The first version copied everything into a scratch directory, which is right
 * for an eval candidate — it exists only in memory — and wrong for a real file:
 * `import { Badge } from './Badge'` stops resolving the moment the file moves,
 * so the check reported a missing module that is sitting right there. Only the
 * render test is written beside the entry, and it is removed again.
 *
 * @param {{ root: string, paths: string[] }} cfg
 */
export function deepCheckInPlace({ root, paths }) {
  const findings = { compiles: [], renders: [] }
  const entry = paths.find((f) => f.endsWith('.tsx') && /export function/.test(readFileSync(f, 'utf8')))
  if (!entry) return { compiles: [], renders: ['no `export function` in any given .tsx — nothing to mount'] }
  const dir = entry.slice(0, entry.lastIndexOf('/'))
  const base = entry.slice(entry.lastIndexOf('/') + 1).replace(/\.tsx$/, '')
  const exported = /export function (\w+)/.exec(readFileSync(entry, 'utf8'))[1]
  const testFile = `${dir}/__verify_${process.pid}.test.tsx`
  const relEntry = entry.replace(`${root}/`, '')

  try {
    execSync('npx tsc --noEmit -p tsconfig.json', { cwd: root, stdio: 'pipe' })
  } catch (e) {
    findings.compiles = `${e.stdout ?? ''}`.split('\n').filter((l) => l.includes(relEntry))
  }

  try {
    writeFileSync(
      testFile,
      `import { expect, it } from 'vitest'\n` +
        `import { render } from '@testing-library/react'\n` +
        `import { a11yViolations } from '@/test/a11y'\n` +
        `import { ${exported} } from './${base}'\n\n` +
        `it('renders and is accessible', async () => {\n` +
        `  const { baseElement } = render(<${exported} />)\n` +
        `  expect(baseElement.querySelectorAll('*').length).toBeGreaterThan(1)\n` +
        `  expect(await a11yViolations(baseElement)).toEqual([])\n` +
        `})\n`,
    )
    const r = spawnSync('npx', ['vitest', 'run', testFile.replace(`${root}/`, '')], { cwd: root, encoding: 'utf8' })
    if (r.status !== 0) {
      const out = `${r.stdout ?? ''}${r.stderr ?? ''}`
      const axe = /expected \[([^\]]*)\] to deeply equal/.exec(out)
      findings.renders = [axe ? `axe violations: ${axe[1]}` : `does not render or is not accessible (${relEntry})`]
    }
  } finally {
    rmSync(testFile, { force: true })
  }
  return findings
}

/**
 * @param {object} cfg
 * @param {string} cfg.root            the design-system package root
 * @param {Record<string,string>} cfg.files  file name → source
 * @param {string} cfg.workDir         a per-process scratch directory under src/
 * @param {string} [cfg.entry]         the file holding the component, default Screen.tsx
 * @returns {{ compiles: string[], renders: string[] }}
 */
export function deepCheck({ root, files, workDir, entry = 'Screen.tsx' }) {
  const findings = { compiles: [], renders: [] }
  const rel = workDir.replace(`${root}/`, '')
  try {
    rmSync(workDir, { recursive: true, force: true })
    mkdirSync(workDir, { recursive: true })
    for (const [name, src] of Object.entries(files)) {
      const target = `${workDir}/${name}`
      mkdirSync(target.slice(0, target.lastIndexOf('/')), { recursive: true })
      writeFileSync(target, src)
    }

    const base = entry.replace(/\.tsx$/, '')
    const exported = /export function (\w+)/.exec(files[entry] ?? files[`${base}.tsx`] ?? '')?.[1]

    try {
      execSync('npx tsc --noEmit -p tsconfig.json', { cwd: root, stdio: 'pipe' })
    } catch (e) {
      const lines = `${e.stdout ?? ''}`.split('\n').filter((l) => l.includes(rel))
      findings.compiles = lines.length ? lines : ['does not typecheck (see npx tsc --noEmit)']
    }

    /* No exported component means there is nothing to mount. Saying so beats
     * writing a test that fails to import and calling that "does not render". */
    if (!exported) {
      findings.renders = [`no \`export function\` in ${entry} — nothing to mount`]
      return findings
    }

    writeFileSync(
      `${workDir}/__render.test.tsx`,
      `import { expect, it } from 'vitest'\n` +
        `import { render } from '@testing-library/react'\n` +
        `import { a11yViolations } from '@/test/a11y'\n` +
        `import { ${exported} } from './${base}'\n\n` +
        `it('renders and is accessible', async () => {\n` +
        `  const { baseElement } = render(<${exported} />)\n` +
        `  expect(baseElement.querySelectorAll('*').length).toBeGreaterThan(1)\n` +
        `  expect(await a11yViolations(baseElement)).toEqual([])\n` +
        `})\n`,
    )
    const r = spawnSync('npx', ['vitest', 'run', rel], { cwd: root, encoding: 'utf8' })
    if (r.status !== 0) {
      const out = `${r.stdout ?? ''}${r.stderr ?? ''}`
      const axe = /expected \[([^\]]*)\] to deeply equal/.exec(out)
      findings.renders = [axe ? `axe violations: ${axe[1]}` : `does not render (see npx vitest run ${rel})`]
    }
  } finally {
    rmSync(workDir, { recursive: true, force: true })
  }
  return findings
}

/* Many candidates, one compiler and one test runner.
 *
 * deepCheck() above is right for one candidate and quietly ruinous for twelve:
 * it runs `tsc --noEmit` over the WHOLE project per candidate (3.0s each,
 * measured) and boots vitest per candidate (1.1s each), so the twelve reference
 * fixtures in the gate cost 55 seconds, of which about 49 were the same work
 * repeated. Since tsc type-checks the whole project anyway, checking twelve
 * candidates at once costs exactly what checking one costs.
 *
 * The two failure kinds are attributed back by path: a compile error names the
 * file it is in, and vitest names the file it failed. Nothing else changes —
 * same test, same assertions, same findings.
 *
 * @param {{ root: string, candidates: {id: string, files: Record<string,string>, workDir: string, entry?: string}[] }} cfg
 * @returns {Record<string, {compiles: string[], renders: string[]}>} by id
 */
export function deepCheckMany({ root, candidates }) {
  const out = Object.fromEntries(candidates.map((c) => [c.id, { compiles: [], renders: [] }]))
  if (!candidates.length) return out

  const written = []
  try {
    for (const c of candidates) {
      rmSync(c.workDir, { recursive: true, force: true })
      mkdirSync(c.workDir, { recursive: true })
      for (const [name, src] of Object.entries(c.files)) {
        const target = `${c.workDir}/${name}`
        mkdirSync(target.slice(0, target.lastIndexOf('/')), { recursive: true })
        writeFileSync(target, src)
      }
      written.push(c)
    }

    /* One compile for all of them. */
    let tscOut = ''
    try {
      execSync('npx tsc --noEmit -p tsconfig.json', { cwd: root, stdio: 'pipe' })
    } catch (e) {
      tscOut = `${e.stdout ?? ''}`
    }
    for (const c of written) {
      const rel = c.workDir.replace(`${root}/`, '')
      const lines = tscOut.split('\n').filter((l) => l.includes(rel))
      if (lines.length) out[c.id].compiles = lines
    }

    /* One render pass for all of them. A candidate with nothing to mount says so
     * instead of being reported as a render failure. */
    const mountable = []
    for (const c of written) {
      const entry = c.entry ?? 'Screen.tsx'
      const base = entry.replace(/\.tsx$/, '')
      const exported = /export function (\w+)/.exec(c.files[entry] ?? c.files[`${base}.tsx`] ?? '')?.[1]
      if (!exported) {
        out[c.id].renders = [`no \`export function\` in ${entry} — nothing to mount`]
        continue
      }
      writeFileSync(
        `${c.workDir}/__render.test.tsx`,
        `import { expect, it } from 'vitest'\n` +
          `import { render } from '@testing-library/react'\n` +
          `import { a11yViolations } from '@/test/a11y'\n` +
          `import { ${exported} } from './${base}'\n\n` +
          `it('renders and is accessible', async () => {\n` +
          `  const { baseElement } = render(<${exported} />)\n` +
          `  expect(baseElement.querySelectorAll('*').length).toBeGreaterThan(1)\n` +
          `  expect(await a11yViolations(baseElement)).toEqual([])\n` +
          `})\n`,
      )
      mountable.push(c)
    }

    if (mountable.length) {
      const common = mountable[0].workDir.slice(0, mountable[0].workDir.lastIndexOf('/')).replace(`${root}/`, '')
      const r = spawnSync('npx', ['vitest', 'run', common], { cwd: root, encoding: 'utf8' })
      if (r.status !== 0) {
        const text = `${r.stdout ?? ''}${r.stderr ?? ''}`
        for (const c of mountable) {
          const rel = c.workDir.replace(`${root}/`, '')
          if (!text.includes(`${rel}/__render.test.tsx`)) continue
          const axe = new RegExp(`${rel}[\\s\\S]{0,2000}?expected \\[([^\\]]*)\\] to deeply equal`).exec(text)
          out[c.id].renders = [axe ? `axe violations: ${axe[1]}` : `does not render (see npx vitest run ${rel})`]
        }
      }
    }
  } finally {
    for (const c of written) rmSync(c.workDir, { recursive: true, force: true })
  }
  return out
}
