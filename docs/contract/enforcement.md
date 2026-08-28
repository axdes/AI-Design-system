# Every check this repository runs, and what each one catches

*Reference for `packages/design-system/AGENTS.md`. The contract stays short enough to read
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
- **`npm test`** (vitest + Testing Library + axe) — what only running code can
  prove: every golden example renders and is axe-clean, every advertised variant
  lands as `data-*`, and every stateful component's keyboard/ARIA contract holds
  (its own `.test.tsx`).
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
- **`audit` + `scan:secrets`, and `lint:sast` in every app** — advisories with
  a written decision each; secrets in what git CARRIES; semgrep over `src` and
  over whatever spawns processes or holds keys. A local server binds loopback
  and checks `Origin` on upgrade: WebSockets ignore CORS.
- **`typecheck:next`** — the same project through TypeScript 7, a second opinion
  in every package's gate. `tsc` 5.9 stays THE compiler.
- **`check:spec`** — screen specs match the system (see below).
- **`tokens:check`** — the DTCG export in `tokens/` still matches `styles/`:
  every alias resolves, every value survives a round trip to CSS, and no token
  is declared twice in one theme with two values.
- **`npm run context`** — the must-read context (AGENTS.md +
  `component-index.md`) has a budget like bundle size; the registry is held to
  a per-entry ceiling.
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
