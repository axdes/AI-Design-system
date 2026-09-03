# Every check this repository runs, and what each one catches

*Reference for `AGENTS.md`. The contract stays short enough to read
in full on every task; this is what it points at when a task needs it.*

## Enforcement (linters + gate + hooks) — ALWAYS ON, not optional

Not honour-system: they run on every change. Off-the-shelf tools do the general
work; one small custom linter covers what only this project knows.

- **`gen-registry:check`** — the registry matches the source, every token a
  component uses is defined, every CSS variant exists in the prop union.
- **ESLint** (`lint`) — TS/React correctness, hooks, jsx-a11y, sonarjs.
- **Stylelint** (`lint:css`) — every `var(--token)` is defined, no `!important`,
  no hex outside `primitives.css`.
- **`scripts/lint-rules.mjs`** (`lint:rules`) — the only custom linter: tokens
  instead of raw px, semantic status roles instead of tonal stops, logical
  properties for RTL, levels.json completeness, atomic import direction, no raw
  form controls, aria-label + Tooltip on icon-only buttons, no reaching into a
  primitive's class+`data-*` contract, no static inline styles, folder shape and
  index re-exports, a golden example per component, dead exports, dead CSS,
  `@media` widths on the `--bp-*` scale, file size. Debt sits in its `ALLOW`
  map — shrink it, never weaken a rule.
- **`check:copy`** — every key a component asks for has words in every locale the
  package ships, in both directions, and in an app also every key of the SYSTEM
  components it imports. i18next renders the KEY when the key is missing, so the
  failure ships as a label and no other check reads it.
- **`lint:graph`** — the RESOLVED import graph (dependency-cruiser): layers
  components → blocks → shell → layouts, atomic ranks, no cycles.
- **`lint:vocab`** — one word per meaning; a union prop name on 2+ components
  must itself be declared in `config/prop-vocabulary.json`.
- **`lint:rules` → a recipe is named, not rebuilt** — `styles/recipes.css` is
  the fourth tier: the complete answers a part would otherwise work out again.
  The ingredients stay legal in the token layer, so the rule is what keeps the
  tier alive — a component that writes `var(--ring-width) solid var(--ring)`,
  the negated ring offset, `1px solid var(--border)` or a `0.5` opacity under a
  disabled selector is rebuilding an answer that exists. Two other checks read
  the OLD spelling and were taught the new one in the same commit: without that,
  `states` called 32 of 34 controls ringless and the restated-ring rule went
  quietly silent.
- **`lint:api`** — the same rule one level deeper, plus four more. One prop
  name resolves to ONE TYPE everywhere (`lint:vocab` checks the VALUES of a
  union and never the shape, so 53 names carried more than one type with every
  gate green); a part past seven props is a compound or writes
  `monolithic because …` in its file AND keeps its count on the ceiling — the
  written reason answers "why is this not a compound" and not "why does it now
  take four more props than when that was written"; a callback comes from the closed list in
  `config/callback-vocabulary.json`; no part is admitted without a test; and
  every published prop is PASSED somewhere in this package — an example, a test,
  a specimen. That last one landed on 2026-09-03 and found 78 props that had
  never been rendered here, `Button.iconEnd` among them, which the contract
  itself described as inert. What counts as one type is decided as carefully as
  the rule: a narrower union of the same words, a union of numbers against
  `number`, a string against `ReactNode`, a collection or render prop of the
  part's own named shape, and a vocabulary callback's payload all fold — but a
  DOM EVENT in a callback never does, and that exception is what caught
  `AuthTemplate.onSubmit` handing every sign-in screen a `FormEvent`. All five
  run against `config/api-debt.json`, a ceiling that only falls: today's numbers
  are recorded, and from here a name may not gain a type, a part may not gain a
  prop, a callback outside the vocabulary may not spread to a new part, a new
  part may not arrive untested, and a part may not publish a prop nothing here
  passes. `npm run lint:api -- --show` prints what the ceiling holds; pay some
  down and re-record with `npm run lint:api -- --record`.
- **`lint:mechanism`** — the same BEHAVIOUR written twice, which copy-paste
  detection cannot see: it compares what a file DOES (which events it binds,
  whether it portals, measures, clamps an index) rather than what it says. A
  pair's shared imports are subtracted first, so calling a shared hook is
  composition and not duplication. The pairs that stood when it landed are in
  `config/mechanism-debt.json`, each with the reason it stands and what would
  close it; a pair not in that file, or one recorded without a reason, fails.
- **`lint:mechanisms`** (plural) — the other half of the same rule, before the
  duplication rather than after it: every module in `src/lib` that exports
  behaviour says what it is for in a comment, and has a caller here or writes
  `published because …` naming the product that takes it. A mechanism nobody can
  find is a mechanism somebody rewrites.
- **`lint:token-layer`** — the token layer held to itself. Nothing dead (a token
  nobody takes is deleted, or exempted in `config/token-exemptions.json` for the
  one reason that survives: the platform cannot read it); no tier reaching
  upwards; no role invented inside a dark block; no stylesheet outside
  `styles/index.css`. Plus **one question, one answer**: how many different
  values answer "how far apart are two things", "how much room does a surface
  give its content", "how far is a section from what is above it", against
  `config/token-answers.json`, a ceiling that only falls. A LADDER STEP IS NEVER
  DEAD — a palette, the type scale and the space scale are complete on purpose
  and `primitives.css` is meant to be swapped whole. The population is this
  package plus `apps/showcase`, deliberately not the products: a product taking
  a token is not a reason for the system to carry it.
- **`check:gates`** — the gate list holds itself. Every step names a real
  script, says what it is for, where its subjects come from (`population`) and
  what it started as (`startedAs`); the CI mode is derived from the same list,
  never hand-kept. A step whose population is a hand-written list must argue for
  it, because a list cannot know what is missing from it.
- **`check:determinism`** — every zone of every screen spec is decided twice,
  once as written and once with the facts and the rule documents shuffled under
  three fixed seeds, and the two verdicts must be identical. An engine that lets
  whichever fact it sees first win looks deterministic for months.
- **`check:corpus`** — every defect this system is known to have shipped names
  the check that finds it now, or says in writing why it cannot be checked
  (`config/defects.json`). It prints the ratio that matters: how many were found
  by a person looking versus by a check. Seeded, not complete — the number of
  unread log entries is carried in the file and only falls.
- **`npm run check:clone`** — not in the gate, run when packaging or the harness
  changes: clone HEAD into a scratch directory, install from the lockfile with
  nothing carried over, and run the CI gate there. It is the proof behind the
  claim that this package is standalone-complete. On its first run it found two
  defects that had been green here for months — a check resolving the repository
  root as three levels above its own file (correct in the monorepo, somebody
  else's directory in a clone) and a suite that passed because of how many cores
  this laptop has. `--worktree` runs it on uncommitted work.
- **`npm run impact`** and **`npm run hunt`** — not checks and never red.
  `impact` says what a change touches before the gate does: which parts changed,
  which baselines carry them, which tokens moved and who reads them, and what is
  generated now stale. `hunt` prints every recorded balance next to today's
  number, so paid-down debt and fresh drift are visible without running
  anything.
- **`npm test`** (vitest + Testing Library + axe) — what only running code can
  prove: every golden example renders and is axe-clean, every advertised variant
  lands as `data-*`, and every stateful component's keyboard/ARIA contract holds
  (its own `.test.tsx`).
- **`ink`** — the same question asked of the PIXELS: every run of text in every
  golden example, both themes, against what is actually behind it. A token can
  be right and the screen still wrong — a descendant setting its own colour
  inside a surface that inverted its ink beats everything the surface said, and
  text on a gradient or a photograph has no single colour to compare against at
  all. Two frames from one DOM: the case, and the case with every glyph made
  transparent. The pixels that differ are the glyphs, and their colour in the
  second frame is the ground; the ink comes from `getComputedStyle`, converted
  to sRGB by the browser. It took eleven days to earn its place in the gate and
  five measurement bugs to get there, every one of which made it QUIETER — the
  worst had it skipping half the catalogue in silence. The history is in the
  file's own header, because a check that has been wrong five times is a check
  whose next reader needs to know how.
- **`npm run contrast`** — WCAG pairs in both themes, from the token files: the
  curated role pairs AND every pair the CSS paints, since a pair nobody listed is
  a pair nobody measures. Misses are recorded with their ratio and may not get
  worse; a painted pair held lower needs a reason in `exempt`.
- **`size`** — a gzipped bundle budget.
- **`visual`** — every golden example screenshotted in a real browser, both
  themes, against committed baselines (`visual/README.md`). Accept with
  `npm run visual:update`.
- **`lint:dup`** (jscpd) copy-paste; **`lint:dead`** (knip) dead code, a triage
  tool rather than a gate step.
- **`npm run scout`** — what belongs here but sits in an app (see the promotion
  rule); findings carry a reason and a closing condition, like `ALLOW`.
- **`check:adoption`** — the other half of that question, as a number rather
  than a verdict: of the elements this system HAS an answer for, the share of
  each product that took it, plus how many of its screens sit on a page
  template. Against floors at the monorepo root that only rise, so a product
  may climb slowly and may not slide back. Structural markup (div, span,
  section) is never counted against anything: a metric that punishes a div
  measures nothing and gets ignored.
- **`audit` + `scan:secrets`, and `lint:sast` in every app** — advisories with
  a written decision each; secrets in what git CARRIES; semgrep over `src` and
  over whatever spawns processes or holds keys. A local server binds loopback
  and checks `Origin` on upgrade: WebSockets ignore CORS.
- **`typecheck:next`** — the same project through TypeScript 7, a second opinion
  in every package's gate. `tsc` 5.9 stays THE compiler.
- **`check:spec`** — screen specs match the system (see below).
- **`check:intake`** — one step before a spec exists. `npm run intake` reads
  somebody else's requirements document and answers every value it pins:
  carried (the system has it), refused (with the nearest thing that does), or
  brand (the client's own colour or typeface, which belongs in a manifest and
  nowhere else). Each refusal is a question put to a person, and this fails on
  one that was never answered — the same rule as `check:requests`, which was
  written after three of those sat unanswered for six weeks.
- **`tokens:check`** — the DTCG export in `tokens/` still matches `styles/`:
  every alias resolves, every value survives a round trip to CSS, and no token
  is declared twice in one theme with two values.
- **`npm run context`** — the must-read context (AGENTS.md +
  `component-index.md`) has a budget like bundle size; the registry is held to
  a per-entry ceiling. It reports the measured multiplier as well: context is
  re-read on every turn, so 1k of must-read costs 1k x turns, and a raise is
  argued against that number rather than against the file size.
- **`npm run cost`** (by hand, not gated) — what a task actually cost, read out
  of the agent's own transcript by the eval runner. The budget above guards the
  input side; this is the bill. A run whose command reported no usage is counted
  separately and never averaged in as free.
- The same five answers are served over MCP (`npm run mcp`, `mcp/README.md`).
- **`redteam`** — breaks the reference solutions the nine ways agents really
  break code and fails if a break survives: every other check asks whether the
  code is right, this one whether we would notice if it were not. A surviving
  mutation is a hole in the scorer, never a mutation to delete.
- **`eval`** — scores a candidate solution against the system
  (`evals/README.md`): how we tell whether a change to the rules, the registry or
  the examples improved anything.

- **`verify -- <files>`** — instant: real components, real props, no inline
  styles. `--deep` (6s) adds types, render and axe, where two thirds of measured
  failures are. Run it on what you just wrote.

**Wiring — runs always, automatically:**
- `npm run check` runs THE gate: one list in `scripts/gates.mjs`, four lanes at
  once, 37 seconds. `check:ci` comes off the same list; a step leaves CI only by
  carrying a written reason (today `visual` and `screens`, committed PNGs of
  rendered text). `--list` prints the steps, `--timings` the seconds, `--from
  <step>` resumes after a fix, `--serial` puts the output in one stream.
- Edit hook (`.claude/settings.json` → PostToolUse) lints on every `.ts/.tsx/.css`
  edit and blocks the edit on failure.
- Stop hook (`scripts/claude-stop-gate.mjs`) blocks finishing a turn while red.
- git `pre-commit` (`.githooks/pre-commit`, enable with
  `git config core.hooksPath .githooks`) runs the full `npm run check`.
