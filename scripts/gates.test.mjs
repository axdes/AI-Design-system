/* The gate list, held to the property the two `&&` chains could not have.
 *
 * `check` ran 28 steps and `check:ci` ran 20, and the contract said the
 * difference was one. Eight had fallen out, three of them the linters that hold
 * the rules no off-the-shelf tool knows. Nothing noticed for months, because
 * nothing could: two hand-kept lists have no relationship a check can read.
 *
 * These tests are that relationship, written down. */
import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { GATES, MODES, gatesFor, isMode, validate } from './gates.mjs'

/* A path relative to the package root: this suite runs under jsdom, where
 * import.meta.url is an http: URL, and vitest runs with the package as cwd. */
const scripts = JSON.parse(readFileSync('package.json', 'utf8')).scripts

describe('the gate list', () => {
  it('names only real npm scripts, once each, all of them saying what they are for', () => {
    expect(validate(scripts)).toEqual([])
  })

  it('runs both modes off the same list, so CI cannot be a smaller idea of the gate', () => {
    const full = gatesFor('full').map((g) => g.run)
    const ci = gatesFor('ci').map((g) => g.run)
    expect(full.length).toBeGreaterThan(20)
    for (const step of ci) expect(full).toContain(step)
    /* Order is part of the gate: cheap and structural first, browser last. */
    expect(ci).toEqual(full.filter((s) => ci.includes(s)))
  })

  it('lets a check out of CI only with a written reason', () => {
    const dropped = gatesFor('full').filter((g) => !gatesFor('ci').includes(g))
    for (const g of dropped) {
      expect(String(g.localOnly).length).toBeGreaterThan(40)
    }
    /* Today that is exactly the one screenshot step left here; `screens`
     * moved to apps/showcase with the screens. If this list grows, the
     * reason has to be as good as theirs and this test is where it is read. */
    expect(dropped.map((g) => g.run)).toEqual(['visual'])
  })

  it('keeps the linters that are the point of the system in CI', () => {
    const ci = gatesFor('ci').map((g) => g.run)
    for (const own of ['lint:rules', 'lint:vocab', 'lint:twins', 'lint:behaviour', 'redteam', 'check:spec']) {
      expect(ci).toContain(own)
    }
  })

  it('is what package.json runs, rather than a second list beside it', () => {
    expect(scripts.check).toContain('run-gates.mjs')
    expect(scripts['check:ci']).toContain('--mode ci')
    /* The failure this prevents: somebody adds a step to the chain in
     * package.json instead of to the list, and CI never sees it again. */
    expect(scripts.check).not.toContain('&&')
    expect(scripts['check:ci']).not.toContain('&&')
  })
})

describe('what actually runs the gate', () => {
  /* The list is only worth something if the two places that consume it still
   * consume it. Both have been wrong before: `.gitlab-ci.yml` described a
   * difference of one check while the real one was eight, and a repository with
   * the hook switched off runs nothing at all on commit. */
  it('is what CI invokes', () => {
    /* Standalone clone (the published repo): no monorepo CI file to check. */
    if (!existsSync('../../.gitlab-ci.yml')) return
    const ci = readFileSync('../../.gitlab-ci.yml', 'utf8')
    expect(ci).toContain('npm run check:ci')
    expect(ci).not.toMatch(/npm run check\s*$/m)
  })

  it('is what the commit hook invokes', () => {
    /* Same standalone-clone allowance as the CI check above. */
    if (!existsSync('../../.githooks/pre-commit')) return
    const hook = readFileSync('../../.githooks/pre-commit', 'utf8')
    expect(hook).toContain('npm run check')
  })
})

describe('the validator bites', () => {
  const withGate = (gate) => {
    const original = GATES.slice()
    GATES.push(gate)
    try {
      return validate(scripts)
    } finally {
      GATES.length = 0
      GATES.push(...original)
    }
  }

  it('catches a step that is not a script', () => {
    expect(withGate({ run: 'lint:nonesuch', why: 'a step nobody wrote' }).join(' ')).toContain('not a script')
  })

  it('catches a step listed twice', () => {
    expect(withGate({ run: 'lint', why: 'again' }).join(' ')).toContain('listed twice')
  })

  it('catches a step with no purpose written down', () => {
    expect(withGate({ run: 'lint:dead' }).join(' ')).toContain('does not say what it is for')
  })

  it('catches a step dropped from CI with an empty reason', () => {
    expect(withGate({ run: 'lint:dead', why: 'triage', localOnly: '  ' }).join(' ')).toContain('no reason written down')
  })

  it('catches a step that does not say where its subjects come from', () => {
    expect(withGate({ run: 'lint:dead', why: 'triage', startedAs: 'the knip run somebody does by hand once a month' }).join(' '))
      .toContain('where its subjects come from')
  })

  it('catches a hand-written population that is not argued for', () => {
    /* `derived` needs no argument; naming your own list does. Four words is not
     * an argument, and this is the shape the field exists to stop: a check that
     * compares against a list and cannot know what is missing from it. */
    expect(withGate({ run: 'lint:dead', why: 'triage', population: 'the usual files', startedAs: 'the knip run somebody does by hand once a month' }).join(' '))
      .toContain('cannot know what is missing')
  })

  it('catches a step that never says what it started as', () => {
    expect(withGate({ run: 'lint:dead', why: 'triage', population: 'derived' }).join(' '))
      .toContain('does not say what it started as')
  })

  it('holds every real step to both, not only the probes', () => {
    /* The rules above bite on a planted gate; this is the one that matters —
     * the list as it actually ships. */
    for (const gate of GATES) {
      expect(String(gate.population ?? ''), `${gate.run} has no population`).not.toBe('')
      expect(String(gate.startedAs ?? '').length, `${gate.run} has no startedAs`).toBeGreaterThan(40)
    }
  })
})

describe('modes', () => {
  it('knows the two it has and rejects anything else', () => {
    expect(isMode('full')).toBe(true)
    expect(isMode('ci')).toBe(true)
    expect(isMode('quick')).toBe(false)
    expect(Object.keys(MODES)).toEqual(['full', 'ci'])
  })
})
