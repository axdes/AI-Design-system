/* THE gate, declared once.
 *
 * It used to be two `&&` chains in package.json, `check` and `check:ci`, kept in
 * step by hand. They were not in step, and nobody could see it: `check` ran 28
 * steps, `check:ci` ran 20, and the contract said the difference was the
 * machine-specific pixel baselines — one check. The eight that had actually
 * fallen out were `lint:vocab`, `lint:twins`, `lint:behaviour`,
 * `gen:checks:check`, `check:products`, `check:routes`, `visual` and `screens`.
 *
 * Three of those are the linters that hold the rules no off-the-shelf tool knows
 * — the prop vocabulary, the confusable pairs, the behaviour a stateful
 * component owes a test. In other words, exactly what makes this a design system
 * rather than a folder of components was the part that stopped running anywhere
 * but on one laptop.
 *
 * Two hand-kept lists of the same thing diverge; the only question is when. So
 * there is one list now, and the modes are derived from it: a check leaves CI by
 * declaring `localOnly` with a reason, and there is no other way out. Adding a
 * check adds it to every mode by construction.
 *
 * Order matters and is preserved: cheap and structural first (a stale registry
 * makes every later failure a lie), then the linters, then tests, then the build
 * and the things that need it, then the browser.
 */

/** @typedef {{ run: string, why: string, lane?: string, needs?: string, localOnly?: string }} Gate */

/* LANES. The gate was one chain of 28 steps and 143 seconds, and its own timing
 * report said two steps were half of that: `eval` compiles and renders twelve
 * reference solutions, and the three browser passes shoot about a hundred
 * screens between them. Everything else — 21 steps including every custom
 * linter — costs ten seconds together.
 *
 * So the steps run in three lanes, concurrently, each lane in its declared
 * order: `main` is everything cheap plus the test suite, `eval` is the pair that
 * compiles fixtures, `browser` is the build and everything that needs its dist.
 * The critical path becomes the longest lane rather than the sum of all three.
 *
 * `needs` says a step cannot start before another one has finished, in any lane:
 * the runner holds it until then. That is what lets the two browser passes run
 * beside each other while both wait for the one build they share. */

/** @type {Gate[]} */
export const GATES = [
  { run: 'gen-registry:check', why: 'the registry matches the source, and every token a component uses exists' , lane: 'main' },
  { run: 'tokens:check', why: 'the DTCG export still matches styles/, value for value' , lane: 'main' },
  { run: 'lint', why: 'TS/React correctness, hooks, a11y' , lane: 'main' },
  { run: 'lint:css', why: 'undefined tokens, !important, raw hex' , lane: 'main' },
  { run: 'lint:rules', why: 'the project rules nothing off-the-shelf knows' , lane: 'main' },
  { run: 'check:copy', why: 'every key a component asks for has words in every locale — a missing one RENDERS as the key' , lane: 'main' },
  { run: 'lint:graph', why: 'the resolved import graph: layer direction and no cycles, a second opinion on architecture' , lane: 'main' },
  { run: 'typecheck:next', why: 'the same project through TypeScript 7, a second opinion' , lane: 'main' },
  { run: 'lint:dup', why: 'copy-paste across the package' , lane: 'main' },
  { run: 'lint:vocab', why: 'one word for one meaning across every component API' , lane: 'main' },
  { run: 'lint:tokens', why: 'one word for one meaning across every token suffix — the same rule, one layer down', lane: 'main' },
  { run: 'lint:twins', why: 'the 74th component is not the 30th again' , lane: 'main' },
  { run: 'lint:behaviour', why: 'a component that DOES something has a test doing it' , lane: 'main' },
  { run: 'scout', why: 'what belongs here but sits in an app' , lane: 'main' },
  { run: 'check:adoption', why: 'the share of each product built from this system, against a floor that only rises' , lane: 'main' },
  { run: 'check:harness', why: 'every app copy of the shared test harness is byte-identical to the canonical one' , lane: 'main' },
  { run: 'contrast', why: 'WCAG pairs in both themes, from the token files' , lane: 'main' },
  { run: 'boundary', why: 'SC 1.4.11 — a control edge against every surface it can land on', lane: 'main' },
  { run: 'states', why: 'one control, one set of answers: hover, press, focus, disabled, invalid', lane: 'main' },
  { run: 'heights', why: 'one ladder: every part that stands in a row stands on 32/40/48', lane: 'browser' },
  { run: 'context', why: 'what the must-read context costs every agent on every task' , lane: 'main' },
  { run: 'check:spec', why: 'screen specs match the system, and their behaviours name a test that claims them' , lane: 'main' },
  { run: 'gen:data:check', why: 'public/data still says what the package says — the account an agent fetches may not drift', lane: 'main' },
  { run: 'gen:shadcn:check', why: 'r/ still installs what src/ contains — the one path a stranger uses to get this' },
  { run: 'check:agent-ready', why: 'the five signals the field audits design systems on are still shipping — each is one generated file, so losing one is silent' },
  { run: 'llms:check', why: 'llms.txt still says what the registry says — the non-MCP outlet may not drift' , lane: 'main' },
  { run: 'check:claims', why: 'the contract may not say a number the system disagrees with — a rule can be true when written and stop being true with nothing near it changing' },
  { run: 'check:skills', why: 'skills, agents and the seven AGENTS.md files still name commands and paths that exist' , lane: 'main' },
  { run: 'check:lang', why: 'the package is published in English — no working-language text in what git carries' , lane: 'main' },
  { run: 'check:requests', why: 'an escalation nobody answered stops being a process' , lane: 'main' },
  { run: 'check:intake', why: 'the same rule one step earlier: a value this system refused in somebody else\'s brief has an answer written against it' , lane: 'main' },
  { run: 'gen:checks:check', why: 'checks.json still describes the checks this repository has' , lane: 'main' },
  { run: 'check:products', why: 'every product has a gate, the files, the aliases — and its hooks switched on' , lane: 'main' },
  { run: 'check:routes', why: 'every route resolves to a screen' , lane: 'main' },
  { run: 'eval', why: 'the scorers still bite on the reference fixtures' , lane: 'eval' },
  /* In the eval lane, not main, and after it. Both drive vitest over src/, and the
   * eval writes a throwaway render test per fixture into src/__eval__ and deletes
   * it: run the two at once and `test:cov` discovers a file that is gone by the
   * time it loads it. Found the first time the gate ran its lanes in parallel,
   * which is the sort of thing a sequential gate hides for years. */
  { run: 'test:cov', why: 'the suite, with a coverage floor that can only be raised', lane: 'eval', needs: 'eval' },
  { run: 'redteam', why: 'and they still bite when the code is broken the nine ways agents break it' , lane: 'eval' },
  { run: 'mutate:check', why: 'and the TESTS still bite: a mutant that used to die may not start surviving', lane: 'eval' },
  /* build:gate, not build. `prebuild` regenerates the registry and the index, and
   * with the lanes running at once that rewrite raced `gen-registry:check` in the
   * main lane, which read a file being written underneath it and called the
   * registry stale. Nothing needs regenerating during a gate: the first step of
   * the main lane has already proved it is fresh. */
  { run: 'build:gate', why: 'it has to compile', lane: 'browser' },
  { run: 'audit', why: 'advisories, each with a written decision' , lane: 'main' },
  { run: 'scan:secrets', why: 'no keys or real addresses in what git carries' , lane: 'main' },
  {
    run: 'visual',
    lane: 'browser',
    needs: 'build:gate',
    why: 'every golden example screenshotted in a real browser, both themes',
    localOnly:
      'Pixel baselines are machine-specific by design: fonts rasterise differently per OS, so on a Linux runner these fail for a reason that is not a regression (visual/README.md). The STRUCTURE half of the same frame is not machine-specific and runs everywhere through audit:pages.',
  },
  /* size, audit:pages and screens moved to apps/showcase on 2026-08-21, with the
   * screens themselves. They measure a PRODUCT — a real bundle, a composed page,
   * a whole screen at three widths — and this package stopped being one: it is a
   * library, and the gallery that used to live inside it now consumes it from
   * apps/ like every other product. `npm run check:all` runs both gates. */
]

/** Which gates run in a mode. Derived, never hand-listed. */
export const MODES = {
  full: () => true,
  ci: (gate) => !gate.localOnly,
}

export const isMode = (name) => Object.hasOwn(MODES, name)
export const gatesFor = (mode) => GATES.filter(MODES[mode])
export const lanesOf = (steps) => {
  const lanes = new Map()
  for (const g of steps) {
    const name = g.lane ?? 'main'
    if (!lanes.has(name)) lanes.set(name, [])
    lanes.get(name).push(g)
  }
  return lanes
}

/* ── the list has to be honest before it can be trusted ──────────────── */
export function validate(scripts) {
  const problems = []
  const seen = new Set()
  for (const gate of GATES) {
    if (!gate.run) problems.push('a gate has no `run`')
    else if (seen.has(gate.run)) problems.push(`${gate.run} is listed twice`)
    else seen.add(gate.run)
    if (!gate.why) problems.push(`${gate.run} does not say what it is for`)
    if (scripts && !Object.hasOwn(scripts, gate.run)) {
      problems.push(`${gate.run} is not a script in package.json`)
    }
    if (Object.hasOwn(gate, 'localOnly') && !String(gate.localOnly).trim()) {
      problems.push(`${gate.run} is excluded from CI with no reason written down`)
    }
  }
  /* Lanes run concurrently, so a step that needs another one's output has to say
   * so, and the dependency has to be reachable: same lane, earlier in it. This is
   * the rule that keeps `visual` from shooting a dist that `build` has not
   * written yet, and it is checked rather than remembered. */
  const indexOf = new Map(GATES.map((g, i) => [g.run, i]))
  for (const gate of GATES) {
    if (!gate.needs) continue
    if (!indexOf.has(gate.needs)) { problems.push(`${gate.run} needs ${gate.needs}, which is not a step`); continue }
    if (indexOf.get(gate.needs) > indexOf.get(gate.run)) {
      problems.push(`${gate.run} needs ${gate.needs}, which is listed after it`)
    }
  }

  /* Derivation, asserted rather than assumed: CI is the full gate minus exactly
   * the steps that say why they are local. */
  const full = new Set(gatesFor('full').map((g) => g.run))
  const ci = new Set(gatesFor('ci').map((g) => g.run))
  for (const name of ci) if (!full.has(name)) problems.push(`${name} runs in CI and not locally`)
  const dropped = [...full].filter((n) => !ci.has(n))
  const declared = GATES.filter((g) => g.localOnly).map((g) => g.run)
  if (dropped.join() !== declared.join()) {
    problems.push(`CI drops ${dropped.join(', ') || 'nothing'} but the reasons cover ${declared.join(', ') || 'nothing'}`)
  }
  return problems
}
