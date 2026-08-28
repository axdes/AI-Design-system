/* Negative tests for the checks nobody else writes.
 *
 * There are sixty tests under src/ and, until this file, none beside the scripts
 * that hold the rules no off-the-shelf tool knows. `npm run redteam` closed the
 * question for the eval scorers — would we notice if the code were broken — and
 * left it open for the linters themselves: if lint-vocab stopped finding
 * violations tomorrow, every gate would stay green and nobody would learn
 * anything until a bad API shipped.
 *
 * So each one is pointed at a deliberately broken copy of this package and has
 * to fail. A linter that cannot be shown failing is a linter nobody can trust
 * when it passes.
 *
 * The copy is made once, mutated per test and put back, and it is a copy on
 * purpose: a test that edits src/ in place is a test that can leave the working
 * tree broken when it is interrupted.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const PKG = process.cwd()
let COPY

/** Run a script against the broken copy. Returns { code, out }. */
function runLinter(script, { root = COPY, args = [] } = {}) {
  try {
    const out = execFileSync(process.execPath, [join(PKG, 'scripts', script), ...args], {
      cwd: PKG,
      encoding: 'utf8',
      env: { ...process.env, DS_LINT_ROOT: root, FORCE_COLOR: '0' },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    return { code: 0, out }
  } catch (e) {
    return { code: e.status ?? 1, out: `${e.stdout ?? ''}${e.stderr ?? ''}` }
  }
}

beforeAll(() => {
  COPY = mkdtempSync(join(tmpdir(), 'ds-linters-'))
  /* Only what the linters read. styles/ comes too: the rules module resolves
   * tokens against it. */
  for (const dir of ['src', 'styles']) cpSync(join(PKG, dir), join(COPY, dir), { recursive: true })
  for (const file of ['component-registry.json', 'config/prop-vocabulary.json', 'config/twins.json']) {
    cpSync(join(PKG, file), join(COPY, file))
  }
}, 60_000)

afterAll(() => {
  if (COPY) rmSync(COPY, { recursive: true, force: true })
})

describe('the copy is clean before anything is broken', () => {
  it('passes every linter that is pointed at it', () => {
    for (const script of ['lint-vocab.mjs', 'lint-twins.mjs', 'lint-behaviour.mjs', 'contrast-check.mjs', 'lint-graph.mjs']) {
      const { code, out } = runLinter(script)
      expect(code, `${script} should pass on an unbroken copy:\n${out}`).toBe(0)
    }
  }, 60_000)
})

describe('lint-vocab', () => {
  it('catches a word that is not in the shared vocabulary', () => {
    const dir = join(COPY, 'src/components/ProbeVocab')
    mkdirSync(dir, { recursive: true })
    /* `tone` is a system-wide axis, so its words are the vocabulary's business.
     * "zesty" is not one of them and never will be. */
    writeFileSync(
      join(dir, 'ProbeVocab.tsx'),
      `type Tone = 'primary' | 'zesty'\nexport function ProbeVocab({ tone }: { tone?: Tone }) { return <button data-tone={tone} /> }\n`,
    )
    const { code, out } = runLinter('lint-vocab.mjs')
    rmSync(dir, { recursive: true, force: true })
    expect(code).toBe(1)
    expect(out).toContain('zesty')
  }, 30_000)

  it('catches a prop name two components share that nobody declared', () => {
    /* The half above can only check words of props the vocabulary already knows,
     * so a brand-new shared NAME was invisible to it — which is how `surface`
     * reached nine components undeclared. This proves the other direction bites.
     * The registry is what that half reads: it is the published API. */
    const path = join(COPY, 'component-registry.json')
    const original = readFileSync(path, 'utf8')
    const registry = JSON.parse(original)
    for (const name of ['ProbeA', 'ProbeB']) {
      registry.components[name] = {
        ref: name,
        main: name,
        /* The probe name has to be one the vocabulary does NOT declare: this
         * half of the linter reads the registry, so it can only see the name.
         * It used to be `density`, which became a real declared prop the day
         * TableToolbar grew a density switch. */
        props: [{ name: 'cadence', type: "'tight' | 'loose'", required: false, values: ['tight', 'loose'] }],
      }
    }
    writeFileSync(path, JSON.stringify(registry, null, 2))
    const { code, out } = runLinter('lint-vocab.mjs')
    writeFileSync(path, original)
    expect(code).toBe(1)
    expect(out).toContain('cadence')
  }, 30_000)
})

describe('lint-twins', () => {
  it('catches a component that is another one again under a new name', () => {
    const path = join(COPY, 'component-registry.json')
    const original = readFileSync(path, 'utf8')
    const registry = JSON.parse(original)
    /* Modal rather than Badge: the linter needs four props before an overlap
     * means anything, which is the guard that stopped its first pass calling
     * Radio and Spinner twins over two coincident names.
     *
     * The copy is a real folder and a real entry, because the linter reads both:
     * the props come from the registry and the rendered markup from the file. */
    const dir = join(COPY, 'src/components/ModalAgain')
    mkdirSync(dir, { recursive: true })
    const source = readFileSync(join(COPY, 'src/components/Modal/Modal.tsx'), 'utf8')
    writeFileSync(join(dir, 'ModalAgain.tsx'), source.replaceAll('export function Modal(', 'export function ModalAgain('))
    registry.components.ModalAgain = { ...registry.components.Modal, ref: 'ModalAgain', main: 'ModalAgain' }
    writeFileSync(path, JSON.stringify(registry, null, 2))

    const { code, out } = runLinter('lint-twins.mjs')
    writeFileSync(path, original)
    rmSync(dir, { recursive: true, force: true })
    expect(code).toBe(1)
    expect(out).toContain('ModalAgain')
  }, 30_000)
})

describe('lint-behaviour', () => {
  it('catches a component that holds state and has no test doing it', () => {
    const dir = join(COPY, 'src/components/ProbeState')
    mkdirSync(dir, { recursive: true })
    writeFileSync(
      join(dir, 'ProbeState.tsx'),
      `import { useState } from 'react'\nexport function ProbeState() {\n  const [on, setOn] = useState(false)\n  return <button aria-pressed={on} onClick={() => setOn(!on)} />\n}\n`,
    )
    const { code, out } = runLinter('lint-behaviour.mjs')
    rmSync(dir, { recursive: true, force: true })
    expect(code).toBe(1)
    expect(out).toContain('ProbeState')
  }, 30_000)
})

describe('contrast', () => {
  it('catches a component that paints its own text into its own background', () => {
    /* The curated pair list could not have caught this: nobody would think to
     * write down "--muted on --muted". The sweep finds it because the rule
     * exists, which is the whole point of reading the CSS instead of a list. */
    const dir = join(COPY, 'src/components/ProbeContrast')
    mkdirSync(dir, { recursive: true })
    writeFileSync(
      join(dir, 'ProbeContrast.css'),
      `.probe-contrast {\n  color: var(--muted-foreground);\n  background: var(--muted-foreground);\n}\n`,
    )
    const { code, out } = runLinter('contrast-check.mjs')
    rmSync(dir, { recursive: true, force: true })
    expect(code).toBe(1)
    expect(out).toContain('--muted-foreground on --muted-foreground')
  }, 30_000)

  it('catches an exemption for a pair the CSS no longer paints', () => {
    /* An exemption that outlives its line is a blanket excuse for whatever
     * lands on that pair next, so a stale one has to fail like a stale twin.
     * The pair has to stop being painted EVERYWHERE, not just in one file:
     * a check mark on a filled control is a shape several components draw,
     * and the sweep reads all of them. */
    const files = ['src/components/Checkbox/Checkbox.css', 'src/components/SelectableTile/SelectableTile.css']
      .map((rel) => join(COPY, rel))
      .filter((f) => existsSync(f))
    const originals = files.map((f) => readFileSync(f, 'utf8'))
    for (const [i, f] of files.entries()) {
      writeFileSync(f, originals[i].replaceAll('var(--primary-foreground)', 'var(--card-foreground)'))
    }
    const { code, out } = runLinter('contrast-check.mjs')
    for (const [i, f] of files.entries()) writeFileSync(f, originals[i])
    expect(code).toBe(1)
    expect(out).toMatch(/no longer paints/)
  }, 30_000)
})

describe('check-screen-spec', () => {
  it('rejects a spec that names a component the system does not have', () => {
    const file = join(COPY, 'probe-spec.json')
    writeFileSync(
      file,
      JSON.stringify({
        id: 'probe-spec',
        title: 'A screen that cannot be built',
        goal: 'Prove the spec checker reads the registry',
        template: 'ListPageTemplate',
        zones: [{ name: 'body', components: ['DataTable'] }],
        states: { empty: 'EmptyState' },
      }),
    )
    /* This one is pointed at a FILE rather than a root, which is the seam it
     * already had. */
    const { code, out } = runLinter('check-screen-spec.mjs', { root: PKG, args: [file] })
    expect(code).toBe(1)
    expect(out).toContain('DataTable')
  }, 30_000)
})

describe('secret-scan', () => {
  it('catches a key in a tree it is pointed at', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ds-secrets-'))
    writeFileSync(join(dir, 'config.mjs'), `export const key = 'sk-ant-api03-${'A'.repeat(40)}'\n`)
    const { code, out } = runLinter('secret-scan.mjs', { root: PKG, args: ['--all', dir] })
    rmSync(dir, { recursive: true, force: true })
    expect(code).toBe(1)
    expect(out.toLowerCase()).toMatch(/key|secret/)
  }, 30_000)

  it('says so plainly when a tree is clean, rather than passing quietly on nothing', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ds-secrets-ok-'))
    writeFileSync(join(dir, 'config.mjs'), `export const url = 'https://example.com'\n`)
    const { code, out } = runLinter('secret-scan.mjs', { root: PKG, args: ['--all', dir] })
    rmSync(dir, { recursive: true, force: true })
    expect(code).toBe(0)
    expect(out).toMatch(/no secrets/i)
  }, 30_000)
})

describe('lint-graph', () => {
  /* The other linters read text; this one reads the RESOLVED graph, so both
   * breaks go in through the shapes a text scan handles worst: an alias import
   * and a two-file cycle. */
  it('catches an import that runs up the ladder, through the real resolver', () => {
    const path = join(COPY, 'src/components/Icon/Icon.tsx')
    const original = readFileSync(path, 'utf8')
    writeFileSync(path, `import '@/components/Modal'\n${original}`)

    const { code, out } = runLinter('lint-graph.mjs')
    writeFileSync(path, original)

    expect(code, out).not.toBe(0)
    expect(out).toContain('atom imports organism')
  }, 60_000)

  it('catches a cycle, which nothing else in the gate looks for', () => {
    const a = join(COPY, 'src/lib/cycleA.ts')
    const b = join(COPY, 'src/lib/cycleB.ts')
    writeFileSync(a, `import './cycleB'\nexport const a = 1\n`)
    writeFileSync(b, `import './cycleA'\nexport const b = 2\n`)

    const { code, out } = runLinter('lint-graph.mjs')
    rmSync(a)
    rmSync(b)

    expect(code, out).not.toBe(0)
    expect(out).toContain('cycle:')
  }, 60_000)
})
