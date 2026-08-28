# AI Design System

**[See it running](https://axdes.github.io/AI-Design-system/)** — every component
with its real example, the rules it decides by, and the checks that hold it.

131 React components that an agent can assemble into screens CORRECTLY — and the
machinery that proves it did. The failure this exists to fix is the one review
does not catch: a screen that compiles, reads fine, and is still wrong. Cards
where a table belongs. A search box over a queue nobody searches.

## Take one component

```bash
npx shadcn@latest add https://raw.githubusercontent.com/axdes/AI-Design-system/main/r/card.json
```

That installs the component, everything it composes, the token layer and
nothing else. Plain CSS with custom properties — no Tailwind, no runtime, no
provider to wrap your app in. Browse what is installable in
[`r/registry.json`](r/registry.json).

## Point your agent at it

```bash
claude mcp add ds -- node /path/to/design-system/mcp/server.mjs
```

Five tools: ask what exists, ask what a component's props MEAN, ask which
representation a zone should use before writing it, and check the code
afterwards. For tools without MCP, [`llms.txt`](llms.txt) is the same knowledge
as text, and [`registry/`](registry/) is one JSON file per component.

## Why an agent gets it right here

Most systems tell an agent what exists. This one also decides. Seven layers of
executable rules answer *which* representation, card, form, table, cell and page
archetype a given task and data shape earn — with the reason and a right/wrong
pair — and the gate rejects a screen that contradicts them. The MCP `decide`
tool answers before you write; `npm run verify` answers after, on code that does
not have to exist on disk yet.

Measured rather than claimed: eight briefs, one live agent run each, scored by
the gate's own validators. The same model on the same briefs without this system
scores 61% and writes six times more code. Numbers and history in
[evals/BASELINE.md](evals/BASELINE.md).

## The five layers

1. **Content model** (`screen-specs/models/`) — what a product's objects ARE:
   attributes, actions, the screens that carry them, with a `provenBy` chain
   from requirement → action → screen behaviour → named test.
2. **Screen specs** (`screen-specs/`) — the agreed structure of every screen:
   archetype, the one question it answers, zones with task + data shape,
   states, acceptance criteria, behaviours. `npm run check:spec` rejects a
   spec that names anything the system does not have — an impossible screen
   cannot be agreed to.
3. **Selection rules** (`screen-specs/selection-rules.json`) — executable
   "which representation for this data and task": rules with reasons and
   good/bad pairs, hard forbids, archetype taxonomy. The validator computes
   "table or cards" from the declared facts and fails the contradiction.
4. **Components and blocks** (`src/`) — 131 components and 12 page templates,
   token-driven, RTL-ready, with a golden example per component that the test
   suite compiles, renders and axe-checks, so the docs cannot drift from the
   code.
5. **The judge lane** (`evals/`, `--judge`) — an LLM answers the brief's
   binary acceptance criteria against delivered code, failing only on clear
   violations. The gate itself stays deterministic.

## Measured, not promised

The eval harness (`evals/`) runs real agents against real briefs and scores
the whole pipeline — model, spec, screen — with the gate's own validators as
the judge. Current baselines: three briefs with three different right answers
(a worklist that must be a table, a hub that must be tiles, settings that
must not be a wizard), nine agent runs, nine perfect scores, each checked for
fixture contamination. The numbers and their history live in
[evals/BASELINE.md](evals/BASELINE.md).

## Quick start

```bash
npm install
npm run dev            # the showcase app, http://localhost:5173
npm run check          # THE gate: 31 steps — registry, linters, tests,
                       # contrast, a11y, page composition, visual baselines
npm run registry -- --search table    # discovery-first: ask before building
npm run eval           # the scorers' self-check on reference fixtures
```

The working agreement for humans and agents alike is [AGENTS.md](AGENTS.md) —
discovery through the registry first, spec before code, every rule enforced
by the gate rather than by hope. `component-index.md` is the generated
one-line-per-component index; `llms.txt` is the same knowledge for tools that
cannot call the registry.

## Map

```
styles/          the three token tiers: settings → primitives → semantic
src/components/  one folder each: Name.tsx + css + golden example
src/blocks/      the page templates (List, Detail, Overview, Settings, Wizard…)
src/shell/       the showcase chrome
screen-specs/    the decision layer: models, specs, selection rules
registry/        the generated component contract, one file per component
evals/           the agent eval harness: tasks, fixtures, baselines, judge lane
scripts/         the gate, the linters, the validators
visual/          pixel + structure baselines, both themes
```

## Stack

Vite · React 19 · TypeScript strict · plain co-located CSS (no Tailwind) ·
react-i18next (en + ar, RTL) · lucide-react.

A standalone clone installs and runs on its own; the monorepo-wide gate steps
detect the absence of the monorepo and say so instead of failing.

## The brand, and how to replace it

The system ships its own: an indigo ramp around `#4638D3`, Commissioner for
headings and Onest for everything else, both self-hosted as variable fonts in
`public/fonts` (one file per script, so a page that is pure Latin never
downloads the Cyrillic one). The whole identity is one file,
`brand/system/manifest.json`, and `npm run rebrand` writes it into
`styles/{settings,primitives,fonts}.css`. Point it at your own palette and
faces and every component follows, because none of them names a colour or a
family: they resolve role tokens.

## License

[MIT](LICENSE) © 2026 Vitali Novikau

The two typefaces are not MIT and are not ours: Commissioner (© 2019 The
Commissioner Project Authors) and Onest (© 2021 The Onest Project Authors) are
under the SIL Open Font License, which travels with them in
`public/fonts/*-OFL.txt`. Keep those files if you keep the fonts.
