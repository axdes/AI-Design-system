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

/** @typedef {{ run: string, why: string, population: string, startedAs: string, lane?: string, needs?: string, localOnly?: string }} Gate */

/* TWO FIELDS THAT ARE NOT DECORATION, added 2026-09-02.
 *
 * `population` — where the step gets its SUBJECTS. `derived` means it walks the
 * code and therefore cannot miss what nobody wrote down; anything else has to
 * say why a named list is the right answer. Two steps say so and both are
 * honest about it: `context` reads the must-read set, which is a decision rather
 * than a discovery, and `check:agent-ready` holds us to five signals somebody
 * else audits systems on. The field exists because a check that asks the wrong
 * population answers confidently and wrongly: `contrast` compared a hand-written
 * list of 20 pairs and passed, and walking the CSS instead found 34 — one of
 * them a live 2.62:1 defect. The same trap was walked into again the day this
 * field landed, when a dead-token check ported from the second system was about
 * to call 27 tokens dead by asking only this package, while products three
 * repositories away were painting with every one of them.
 *
 * `startedAs` — the measurement or the incident the step came from. A check that
 * keeps nobody's promise is ceremony, and ceremony is what a tired person
 * deletes. Written in the past tense on purpose: it is a fact about what
 * happened, not a claim about what the check is worth. */

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
  /* First, and cheapest: the list itself. A manifest can be edited without
   * anything running it, and then the first person to find out is CI. */
  { run: 'check:gates',
    why: 'the gate list holds itself: every step names a script, says what it is for, where its subjects come from and what it started as',
    population: 'derived — GATES itself, and the scripts package.json declares',
    startedAs: 'the manifest is data, and data with no validator is a hand-kept list again. Its two newest fields, population and startedAs, went in the same day and would rot the same way without this.',
    lane: 'main' },
  { run: 'gen-registry:check', why: 'the registry matches the source, and every token a component uses exists' , lane: 'main' ,
    population: 'derived — walks src/components and src/blocks and re-reads every source file',
    startedAs: 'the registry IS the interface: an agent reads it instead of the code, so a stale one makes every later failure a lie. It runs first for that reason, and the red team keeps two breaks against it.',
  },
  { run: 'tokens:check', why: 'the DTCG export still matches styles/, value for value' , lane: 'main' ,
    population: 'derived — every declaration in styles/*.css and styles/brands/*',
    startedAs: 'the DTCG export is a second copy of the token layer, and a copy nobody checks drifts. The check proves the round trip value for value.',
  },
  { run: 'lint', why: 'TS/React correctness, hooks, a11y' , lane: 'main' ,
    population: 'derived — eslint walks the project',
    startedAs: 'the off-the-shelf floor: TS and React correctness, hooks, jsx-a11y, sonarjs. No incident of ours; everything else stands on it.',
  },
  { run: 'lint:css', why: 'undefined tokens, !important, raw hex' , lane: 'main' ,
    population: 'derived — stylelint walks src, styles and visual/',
    startedAs: 'visual/ joined the glob after the gallery painted CSS that no token check read: tooling is built from the system too, or it is a second system nobody holds.',
  },
  { run: 'lint:rules', why: 'the project rules nothing off-the-shelf knows' , lane: 'main' ,
    population: 'derived — walks the source for CSS and code. Its ALLOW map is accepted debt, not the population: a rule still runs everywhere',
    startedAs: 'the rules no off-the-shelf tool knows — raw px off the 4px grid, tonal primitives where a status role belongs, physical properties that break RTL, icon-only buttons with no label.',
  },
  { run: 'check:copy', why: 'every key a component asks for has words in every locale — a missing one RENDERS as the key' , lane: 'main' ,
    population: 'derived — every key a component asks for, read out of the source, against every locale the package ships',
    startedAs: 'a menu item that rendered `console.setUnavailable` on screen in the showcase, under a user avatar. i18next renders the KEY when the key is missing, so the failure ships as a label and no other check reads it.',
  },
  { run: 'lint:graph', why: 'the resolved import graph: layer direction and no cycles, a second opinion on architecture' , lane: 'main' ,
    population: 'derived — the resolved import graph, 510 modules and 958 edges when it was measured on 2026-08-19',
    startedAs: 'a second opinion on the architecture: lint:rules reads import LINES, this resolves them for real, and it is the only thing here that looks for a cycle.',
  },
  { run: 'typecheck:next', why: 'the same project through TypeScript 7, a second opinion' , lane: 'main' ,
    population: 'derived — the same project through TypeScript 7',
    startedAs: 'a second compiler as a second opinion. tsc 5.9 stays THE compiler; this one is the early warning.',
  },
  { run: 'lint:dup', why: 'copy-paste across the package' , lane: 'main' ,
    population: 'derived — jscpd over src and styles',
    startedAs: 'the cheap half of duplication. It reported under its threshold and passed on 2026-09-02 while one anchored layer sat in five parts, which is why lint:mechanism now runs beside it.',
  },
  { run: 'lint:vocab', why: 'one word for one meaning across every component API' , lane: 'main' ,
    population: 'derived from the registry and the source; the vocabulary itself is a declared decision in config/prop-vocabulary.json, because a word cannot be discovered from code',
    startedAs: 'the system had quietly split in two places: `danger` against `destructive` for a bad status, `neutral` against `default` for no status.',
  },
  /* lint:vocab holds the shared props to one set of VALUES and never looked at
   * the SHAPE, so 53 prop names carried more than one type with every gate
   * green; lint:dup compares text and reported under its threshold while one
   * anchored layer sat in five parts. Both landed 2026-09-02 against a recorded
   * ceiling rather than against zero: a check that has to wait for the debt to
   * be paid is a check that never lands. */
  { run: 'lint:api', why: 'one prop name one type, seven props then compound, callbacks from a closed list, no part without a test — each against a ceiling that only falls' , lane: 'main' ,
    population: 'derived from component-registry.json, which is generated from the source',
    startedAs: '53 prop names resolved to more than one type with every gate green on 2026-09-02: `label` on 50 parts as both string and ReactNode, `onChange` on 18 with four signatures. lint:vocab checked union VALUES and never the shape.',
  },
  { run: 'lint:mechanism', why: 'the same BEHAVIOUR written twice, which copy-paste detection cannot see — the pairs are recorded with reasons and the number only falls' , lane: 'main' ,
    population: 'derived — every .ts and .tsx under src, walked',
    startedAs: 'jscpd passed under its threshold on 2026-09-02 while Tooltip and HoverCard each built their own portal, rect, viewport, timer and clone, and Dropdown and TreeTable each rewrote the list navigation src/lib/useListNavigation.ts already owns.',
  },
  { run: 'lint:tokens', why: 'one word for one meaning across every token suffix — the same rule, one layer down', lane: 'main' ,
    population: 'derived — every semantic token declaration',
    startedAs: '`-emphasis` read as a duplicate of the base because in the LIGHT theme it resolves to the same value; only the dark theme reveals it as a separate role (2026-08-26).',
  },
  { run: 'lint:mechanisms',
    why: 'behaviour is a part: every mechanism in src/lib says what it is for, and has a caller or says why it is published without one',
    population: 'derived — every module in src/lib that exports behaviour, and every import of it in this package (src/ and visual/). Deliberately not the products, nor the showcase next door: a directory that exists in the monorepo and not in the published copy gave the same code two verdicts, and only check:clone could see it.',
    startedAs: 'the catalogue has had discovery-first from the beginning and behaviour had none of it: no index row, no rule, no caller check. Four of six floating layers were written by hand beside a hook that already did the whole job, because there was nothing to discover.',
    lane: 'main' },
  { run: 'lint:token-layer',
    why: 'the token layer holds itself: nothing dead, no tier reaching upwards, no name invented in the dark, no sheet outside the layer',
    population: 'derived — every declaration in styles/, every reference in styles/, src/, visual/ and apps/showcase/src. The products are deliberately NOT in it: the system and its showcase are the source, and an app that takes a token is not a reason to keep one',
    startedAs: 'a dead-token check ported from the second system was about to call 27 tokens dead by asking only this package, while 18 of them were ladder steps, five were unreadable by construction and the rest were painted by products three repositories away. The rule that came out of it is the population, and it found six real ones.',
    lane: 'main' },
  { run: 'lint:twins', why: 'the 74th component is not the 30th again' , lane: 'main' ,
    population: 'derived from the registry plus the rendered markup; config/twins.json holds the accepted pairs with their reasons',
    startedAs: 'discovery-first, held as a check. scout holds the APPS to it and nothing held the system, so the 74th component could repeat the 30th and every gate would stay green.',
  },
  { run: 'lint:behaviour', why: 'a component that DOES something has a test doing it' , lane: 'main' ,
    population: 'derived — every component that holds state or binds a key',
    startedAs: 'a golden example renders and passes axe, but it cannot press a key and it cannot notice a toggle that never toggles.',
  },
  { run: 'scout', why: 'what belongs here but sits in an app' , lane: 'main' ,
    population: 'derived — walks every app beside this checkout; a finding is closed by promoting the code or by recording a reason and its closing condition',
    startedAs: 'the promotion rule made mechanical. The failure is quiet: both apps work and the gate stays green while the system stops being where components live.',
  },
  { run: 'check:adoption', why: 'the share of each product built from this system, against a floor that only rises' , lane: 'main' ,
    population: 'derived — every element in each product that this system HAS an answer for. The floors are recorded data about the products, not the population',
    startedAs: 'scout and lint:rules are pass/fail on specific lines, which is right for a gate and useless for direction: an app can sit green all year while the share of its UI that comes from the system falls.',
  },
  { run: 'check:harness', why: 'every app copy of the shared test harness is byte-identical to the canonical one' , lane: 'main' ,
    population: 'derived — every app copy of the shared harness, byte-compared against the canonical one',
    startedAs: 'the harness is COPIED into every app so each repository runs its suite standalone. A copy is safe only while it cannot drift.',
  },
  { run: 'contrast', why: 'WCAG pairs in both themes, from the token files' , lane: 'main' ,
    population: 'derived — every pair the CSS actually paints, plus the curated role pairs. Walking the CSS instead of a hand-written list of 20 pairs found 34',
    startedAs: 'that measurement, and the 2.62:1 live defect inside it: a pair nobody listed is a pair nobody measures.',
  },
  { run: 'boundary', why: 'SC 1.4.11 — a control edge against every surface it can land on', lane: 'main' ,
    population: 'derived — every control edge against every surface it can land on',
    startedAs: 'SC 1.4.11. contrast measures TEXT — a colour and a background in one rule — and is blind by construction to the edge of a control, which is what actually broke.',
  },
  { run: 'states', why: 'one control, one set of answers: hover, press, focus, disabled, invalid', lane: 'main' ,
    population: 'derived — every control in the catalogue, read from its own CSS and from the reset that answers for it',
    startedAs: 'the five answers had drifted in every direction: NumberInput answered focus by recolouring a 1px border while every sibling drew a 2px ring, and Checkbox, Radio, Switch and Slider had no press at all.',
  },
  { run: 'context', why: 'what the must-read context costs every agent on every task' , lane: 'main' ,
    population: 'declared, not derived — the must-read set is a decision: AGENTS.md and component-index.md are what an agent is TOLD to read before it may touch the UI. Anything else it reads, it chooses',
    startedAs: 'context is re-read on every turn, so 1k of must-read costs 1k times the turns. That makes it a budget like bundle size rather than a free resource.',
  },
  { run: 'check:spec', why: 'screen specs match the system, and their behaviours name a test that claims them' , lane: 'main' ,
    population: 'derived — every screen spec in screen-specs/, against the registry and the eight rule layers',
    startedAs: 'a spec that names a component, a prop or a value the system does not have is an impossible screen agreed to in advance, and agreeing costs a minute while building costs an afternoon.',
  },
  { run: 'check:determinism',
    why: 'every zone reaches the same verdict whatever order its facts and its rules are written in',
    population: 'derived — every spec in screen-specs/ and the rule documents the spec check loads',
    startedAs: 'the eight decision layers rest on a promise nothing checked: that the answer comes from the declared facts and nothing else. selection-rules.json carries a precedence list because an engine that let the first match win had already bitten once, and a JSON file reordered for tidiness would have brought it back silently.',
    lane: 'main' },
  { run: 'gen:data:check', why: 'public/data still says what the package says — the account an agent fetches may not drift', lane: 'main' ,
    population: 'derived — regenerated from the registry and the rules, then compared',
    startedAs: 'public/data is the account an agent FETCHES rather than reads. A published outlet that drifts is worse than none, because it is trusted instead of the source.',
  },
  { run: 'gen:shadcn:check', why: 'r/ still installs what src/ contains — the one path a stranger uses to get this' ,
    population: 'derived — regenerated from src and compared',
    startedAs: '`npx shadcn add <url>` is how a component reaches a project, and r/ is the one path a stranger uses to get this system. It may not describe a src that has moved.',
  },
  { run: 'gen:skill:check', why: '.agents/skills still says what the registry and the rules say — the outlet an agent loads BY ITSELF may not drift' ,
    population: 'derived — regenerated from the registry and the rules, then compared',
    startedAs: 'the Agent Skill is the outlet an agent loads BY ITSELF, without being told. Drift there is a contract nobody proofread being obeyed.',
  },
  { run: 'check:agent-ready', why: 'the five signals the field audits design systems on are still shipping — each is one generated file, so losing one is silent' ,
    population: 'the five signals are an external benchmark (designsystems.one, 37 systems audited), so the list is theirs and is named here rather than derived from us',
    startedAs: 'each signal is one generated file, so losing one is silent: nothing breaks, the system simply stops being findable the way the field looks for it.',
  },
  { run: 'llms:check', why: 'llms.txt still says what the registry says — the non-MCP outlet may not drift' , lane: 'main' ,
    population: 'derived — regenerated from the registry and compared',
    startedAs: 'v0, Lovable, Bolt and half the generation tools read llms.txt instead of speaking MCP. The non-MCP outlet may not drift.',
  },
  { run: 'check:corpus',
    why: 'every defect this system is known to have shipped names the check that finds it now, or says in writing why it cannot be checked',
    population: 'config/defects.json, seeded by hand from the working log and from what a session finds. NOT derived and it says so: 604 of 609 log entries are unread, and that number is carried in the file as debt rather than hidden',
    startedAs: 'the second system built this ledger out of THIS one and measured the answer: 34 of its 46 recorded defects were found by a person looking at a screen and 7 by the gate. That ratio is the thing every check here exists to move, and nothing here was measuring it.',
    lane: 'main' },
  { run: 'check:claims', why: 'the contract may not say a number the system disagrees with — a rule can be true when written and stop being true with nothing near it changing' ,
    population: 'derived — every countable claim in the contract, re-counted against the system it describes',
    startedAs: 'a rule can be true when written and stop being true with nothing near it changing. Review catches a rule that was wrong; nothing caught one that went stale.',
  },
  { run: 'check:skills', why: 'skills, agents and the seven AGENTS.md files still name commands and paths that exist' , lane: 'main' ,
    population: 'derived — every command and path named in the skills, the agents and the seven AGENTS.md files',
    startedAs: 'a stale skill is worse than stale documentation: it actively steers the next session into a command that no longer exists or a path that moved.',
  },
  { run: 'check:publishable',
    why: 'nothing in the tree that would ship names a client or a client product',
    population: 'derived — every file the publisher would actually send, minus the ones config/publishable.json drops, against the declared identifiers',
    startedAs: 'it caught three real ones on 2026-09-02 and nothing ran it: "published because ..." notes written the day before named client products by name in files that go to a public repository. The check existed, the publisher used it, and the gate did not — so the only thing standing between a client name and github.com was somebody remembering to publish.',
    lane: 'main' },
  { run: 'check:lang', why: 'the package is published in English — no working-language text in what git carries' , lane: 'main' ,
    population: 'derived — every file git carries',
    startedAs: 'the package is published in English. Working-language text in what git carries reaches a stranger who cannot read it.',
  },
  { run: 'check:requests', why: 'an escalation nobody answered stops being a process' , lane: 'main' ,
    population: 'derived — every request in requests/',
    startedAs: 'three escalations sat unanswered for six weeks. An escalation nobody answers stops being a process and becomes a folder.',
  },
  { run: 'check:intake', why: 'the same rule one step earlier: a value this system refused in somebody else\'s brief has an answer written against it' , lane: 'main' ,
    population: 'derived — every value an intake pinned, refused or called brand',
    startedAs: 'the same rule one step earlier: a value this system refused in somebody elses brief is a question put to a person, and a question nobody answered is the state requests/ was written for.',
  },
  { run: 'gen:checks:check', why: 'checks.json still describes the checks this repository has' , lane: 'main' ,
    population: 'derived — every verifying script in every package, found by name rather than listed',
    startedAs: 'the manifest missed three checks that were IN the gate — gen-registry:check, tokens:check and redteam — because none of their names began with one of the old prefixes (2026-08-14). A manifest of the checks that quietly omits a check is the failure it exists to prevent.',
  },
  { run: 'check:products', why: 'every product has a gate, the files, the aliases — and its hooks switched on' , lane: 'main' ,
    population: 'derived — every app beside this checkout',
    startedAs: 'seven repositories each need the hook enabled separately, and without it nothing is enforced on commit. A product with no gate is a product the system cannot promise anything about.',
  },
  { run: 'check:routes', why: 'every route resolves to a screen' , lane: 'main' ,
    population: 'derived — every route each product declares',
    startedAs: 'a route that resolves to nothing is a screen nobody can reach and nobody notices missing.',
  },
  { run: 'eval', why: 'the scorers still bite on the reference fixtures' , lane: 'eval' ,
    population: 'derived — every reference fixture in evals/',
    startedAs: 'how we tell whether a change to the rules, the registry or the contract makes an agent better or worse. Without it a contract change is an opinion.',
  },
  /* In the eval lane, not main, and after it. Both drive vitest over src/, and the
   * eval writes a throwaway render test per fixture into src/__eval__ and deletes
   * it: run the two at once and `test:cov` discovers a file that is gone by the
   * time it loads it. Found the first time the gate ran its lanes in parallel,
   * which is the sort of thing a sequential gate hides for years. */
  { run: 'test:cov', why: 'the suite, with a coverage floor that can only be raised', lane: 'eval', needs: 'eval' ,
    population: 'derived — vitest over src, against a coverage floor that can only rise',
    startedAs: 'what only running code can prove: every golden example renders and is axe-clean, every advertised variant lands as data-*, every stateful component keeps its keyboard contract.',
  },
  { run: 'redteam', why: 'and they still bite when the code is broken the nine ways agents break it' , lane: 'eval' ,
    population: 'derived — the reference solutions, broken the nine ways agents really break code',
    startedAs: 'every other check asks whether the code is right. This one asks whether we would notice if it were not, and a surviving mutation is a hole in the scorer rather than a mutation to delete.',
  },
  { run: 'mutate:check', why: 'and the TESTS still bite: a mutant that used to die may not start surviving', lane: 'eval' ,
    population: 'derived — mutants generated from the source; mutation-baseline.json records which survive and why',
    startedAs: 'the tests are a check like any other, and a mutant that used to die may not start surviving.',
  },
  /* build:gate, not build. `prebuild` regenerates the registry and the index, and
   * with the lanes running at once that rewrite raced `gen-registry:check` in the
   * main lane, which read a file being written underneath it and called the
   * registry stale. Nothing needs regenerating during a gate: the first step of
   * the main lane has already proved it is fresh. */
  { run: 'build:gate', why: 'it has to compile', lane: 'browser' ,
    population: 'derived — the whole project through tsc and vite',
    startedAs: 'it has to compile, and the browser lane needs a dist that is this commit rather than whatever was there.',
  },
  { run: 'audit', why: 'advisories, each with a written decision' , lane: 'main' ,
    population: 'derived — npm audit over the installed tree, each advisory carrying a written decision',
    startedAs: 'a dependency is code we ship without reading. The decision is the point: an advisory with no answer is one nobody read either.',
  },
  { run: 'scan:secrets', why: 'no keys or real addresses in what git carries' , lane: 'main' ,
    population: 'derived — every file git carries',
    startedAs: 'an Anthropic key reached the transcript history once and has to be rotated. Keeping the next one out is the cheap half, and it is this.',
  },
  {
    run: 'visual',
    population: 'derived — every golden example, both themes',
    startedAs: 'a photograph of the system. Its structure half earned the second baseline on its own: a real defect came back under the 0.1% pixel tolerance and only the DOM snapshot caught it.',
    lane: 'browser',
    needs: 'build:gate',
    why: 'every golden example screenshotted in a real browser, both themes',
    localOnly:
      'Pixel baselines are machine-specific by design: fonts rasterise differently per OS, so on a Linux runner these fail for a reason that is not a regression (visual/README.md). The STRUCTURE half of the same frame is not machine-specific and runs everywhere through audit:pages.',
  },
  /* `needs: build:gate` because it measures dist, exactly like `visual`. Left
     without it, this ran beside the build in the same lane and measured whatever
     dist happened to hold — a whole gate's worth of baselines came back
     "different" for no reason at all (2026-08-29). */
  { run: 'heights', why: 'one ladder: every part that stands in a row stands on 32/40/48', lane: 'browser', needs: 'build:gate' ,
    population: 'derived — every part that stands in a row, measured in a real browser against dist',
    startedAs: 'one ladder, 32/40/48. A height decided by CSS is only true after the cascade, so it is measured rather than read.',
  },
  { run: 'ink', why: 'every run of text against the pixels actually behind it, which no reading of the tokens can see', lane: 'browser', needs: 'build:gate',
    population: 'derived — every run of text in every golden example, both themes, in a real browser',
    startedAs: 'four legibility failures the owner reported in one afternoon with every check green (2026-08-23): three were a descendant setting its own colour inside a surface that had inverted its ink, and the fourth sat on a gradient. It stayed out of the gate for eleven days because it was measuring badly — 18, 21 and 25 findings on three consecutive runs of an unchanged tree — and joined it on 2026-09-03, once the ink came from the DOM and the ground from under the glyphs.',
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
    /* A population of `derived` needs no argument: walking the code is the
     * answer. Anything else is a hand-written list, and a list cannot know what
     * is missing from it, so it owes a sentence saying why it is right here. */
    if (!gate.population || !String(gate.population).trim()) {
      problems.push(`${gate.run} does not say where its subjects come from — see \`population\``)
    } else if (!String(gate.population).startsWith('derived') && String(gate.population).trim().length < 40) {
      problems.push(`${gate.run} names its own population without arguing for it: a list cannot know what is missing from it`)
    }
    if (!gate.startedAs || String(gate.startedAs).trim().length < 40) {
      problems.push(`${gate.run} does not say what it started as — the measurement or the incident, or it is ceremony`)
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
