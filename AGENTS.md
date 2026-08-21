# Design System — System Contract

Math-driven CSS + React component library for LLM-assisted development.
Tune via `styles/settings.css`; never hardcode in components.

This is `packages/design-system`; **every path below is relative to it**. The
products in `apps/*` consume it through `@ds` / `@blocks` / `@styles`.

## MUST: Discovery first — ask the index, read it only when you must

Before ANY UI work, find out what already exists. Ask first; the whole list is
the fallback for when you do not yet know what to ask for:

```bash
npm run registry -- --search table     # the question you usually have
npm run registry -- Modal Field        # props, allowed values, variants, example
npm run registry -- --dense DataGrid   # the same without the example
npm run registry -- --tokens space     # the token catalogue
```

`/component-index.md` is that whole list, one line per component, generated and
never stale, about 3k tokens to read. Read it when a search would be a guess.
Either way that file is the system: if a thing is not in it, it does not exist.

- Do not hand-roll UI one of them already covers; the pairs that get confused are
  in "Choosing between neighbours" below.
- NEVER invent props or variant values. If `npm run registry -- <Name>` does not
  list it, it does not exist; `props[].values` holds the allowed unions, and
  `from` says where to import it: `@/components/<Name>` here, `@ds/<Name>` in an
  app.
- The full contract behind that command lives in `registry/<Name>.json`, one file
  per component, and that is what git carries; `component-registry.json` is the
  same thing combined, derived and gitignored, and it is what the linters read.
  Never edit either by hand and do not read the combined one whole (44k tokens for
  93 components you will not use). `npm run gen-registry` writes all of it;
  `gen-registry:check` fails on drift, undefined tokens, or a CSS variant missing
  from a prop union.
- If no component (or composition of them, or a new data-variant on one) covers
  the need, do NOT hand-roll inline JSX. File a request in `requests/` (format in
  requests/README.md), STOP, and ask the user to decide: compose from existing /
  add to registry / reject. Only after approval create the component ("Creating a
  new component" below) and re-run `npm run gen-registry` in the same turn.
- `status` comes from JSDoc tags on the main export: `@experimental` and
  `@deprecated`; untagged is canonical, and only canonical components are worth
  composing from.
- The first sentence of a component's JSDoc IS its index row. Write it for the
  agent who will pick it: what it is for, and when to reach for it instead of its
  neighbour.

## Button icon placement

- Default: icon leads (left). Plain or navigational buttons keep the icon on the left.
- "Add/create" actions: pass `iconEnd` so the icon trails (right), and use a meaningful add-type icon (`add`, `create_new_folder`, `person_add`, etc.) that signals creation.

## MUST: Copy / writing style (UI text, i18n, commits)

- No emojis anywhere (UI strings, code, comments, commit messages) unless the user explicitly asks.
- No AI-isms or filler: avoid "seamless", "effortless", "unlock", "elevate", "dive in", "delve", "in today's world", "whether you're...". Write plain, concrete copy.
- Do not invent product facts, routes, or features in copy. If something is a placeholder, say so plainly.

## MUST: Log every change in CHANGELOG-REVIEW.md

After any non-trivial change (a component, a token, a fix with a non-obvious
cause, a refactor across files, a decision that overrides an earlier one), append
an entry to `/CHANGELOG-REVIEW.md` saying **what changed and why**, in the same
turn as the change. Typos and mid-session iteration do not need one. Without the
log the next session loses the reasoning and the user cannot trace a decision.

## Stack

Vite + React 19 + TypeScript strict, React Router v7, plain co-located CSS (no
Tailwind, no CSS modules), `lucide-react` behind `src/components/Icon`, and
`react-i18next` (en + ar, RTL through `<html dir>`).

## File map
```
styles/                  ← foundation only
  settings.css           ← THE place to tune the system (knobs)
  primitives.css         ← computed tokens (do not edit)
  semantic.css           ← role tokens (--primary, --background) via light-dark()
  reset.css              ← + prefers-reduced-motion
  fonts.css              ← @font-face, written by rebrand
  demo.css               ← only loaded on /playground
  index.css              ← imports the foundation in order

src/components/          ← FLAT component layer (one folder per component)
  levels.json            ← the atomic level of every component (atom/molecule/
                           organism). Level is METADATA, not a folder: the
                           registry and the linter both read this file, so a new
                           component MUST be classified here.
  surfaces.json          ← surface context per component: `page` (owns viewport) /
                           `region` (own surface) / `card` (inside a card/form).
                           Registry emits it as `context`; linter requires it.
  <Name>/                ← one folder per component. component-registry.json is
                           the authoritative list; it is not repeated here.
                           Each folder: Name.tsx + Name.css + Name.example.tsx
                           + index.ts. Card / Dropdown / Tabs / Table / Layout
                           export several parts — see their index.ts

src/blocks/              ← product-agnostic COMPOSITIONS bigger than a component
  AuthTemplate/ DetailPageTemplate/ FormModal/ ListPageTemplate/
  Page structure lives here; build screens from these, do not hand-roll chrome.

src/shell/               ← app chrome wired to routing/providers (not the DS)
  AppShell/ ChatHistory/ Sidebar/ ThemeToggle/ UserMenu/

src/lib/                 ← utilities, providers, hooks. filterBarContext.ts lets
                            FilterBar (organism) and FilterDropdown (molecule)
                            talk without an atomic-direction violation.

src/test/                ← the harness and the system-wide tests: every golden
                            example renders and is axe-clean, and every variant
                            the registry advertises lands as `data-*`.

evals/                   ← does an agent's output actually use this system?
                            One-shot scores in run.mjs, the long-session drift
                            curve in drift.mjs, measured runs in BASELINE.md.

visual/                  ← pixel baselines for every golden example, both themes.

tokens/                  ← the DTCG export, generated from styles/ by
                            `npm run tokens`. How anything outside this repo
                            (Style Dictionary, Tokens Studio, Figma) reads the
                            system. Never edit it.

screen-specs/            ← agreed screen structure, validated against the registry
  schema.json  documents-list.json          (see screen-specs/README.md)

src/layouts/             ← route-level layout templates named `*Page`. The
                            routes ARE the template demos; Playground is the
                            gallery.
```

## Path aliases
`@/` = `src/`. Prefer `@/components/Button` over `../../Button`.

## Architecture invariants (DO NOT VIOLATE)

1. **3-tier tokens**: `settings` → `primitives` → `semantic`. Components use semantic only.
2. **Atomic dependency direction** (level comes from `src/components/levels.json`,
   the folder tree is flat). Never import UP the ladder; same-level imports are
   fine (IconButton → Icon, Select → Dropdown):
   - atom → atoms only
   - molecule → atoms + molecules
   - organism → atoms + molecules + organisms
   - block → any component; shell → blocks + components; layout → anything
3. **Components use `className` + `data-*` attributes**. No inline styles. No styled-components.
4. **One component per folder**: `Button/Button.tsx + Button.css + index.ts`.
5. **No magic numbers in components**. Use `var(--space-*)`, `var(--font-*)`, `var(--radius-*)`.
6. **No hex colors outside `primitives.css`**. Semantic/components/pages reference primitives.
7. **No `!important`** — fix specificity or cascade order instead.
8. **Logical properties for RTL** — `padding-inline-*`, `border-inline-*`, `text-align: start/end`.
9. **No password in localStorage** — strip sensitive fields before persisting.

## MUST: Golden examples — one per component, and they are real code

Every component and block ships `Name.example.tsx` next to its source: a REAL
module that imports the component and exports `Example()`. Not a snippet.

```tsx
/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { Switch } from './Switch'

export function Example() {
  const [on, setOn] = useState(true)
  return <Switch checked={on} onChange={setOn} label="Weekly digest" />
}
```

Why a module and not a string: the example is what an agent copies, so it has to
be true. Being real code means `tsc` breaks when a prop is renamed, the test
suite renders it, and axe checks it — the docs cannot drift away from the
component. `npm run gen-registry` strips the imports and the wrapper and puts the
usage into `component-registry.json`.

Rules for writing one:
- Show the component the way it is meant to be used, including its required
  companions (an `IconButton` example includes the `<Tooltip>` wrapper).
- Prefer one realistic case over a gallery of variants. The variants are already
  in the registry; the example teaches composition.
- Fixture data goes in the module body — it is published with the snippet and
  explains what the props expect.
- Add a short comment for anything non-obvious (what `label` is for, why a value
  normalises). That comment reaches the agent.

## MUST: New screen? Spec first, code second

For a NEW screen (not a tweak to an existing one), write a screen spec before
writing components: `screen-specs/<id>.json`, format in
[screen-specs/README.md](screen-specs/README.md).

- The spec names the template, the zones, the components in each zone, and what
  happens when the screen is empty or broken.
- The spec declares DECISIONS: `archetype`, `primaryQuestion`, zone
  `task` + `data`; `check:spec` computes "table or cards" from
  screen-specs/selection-rules.json. New project? Model first:
  screen-specs/models/. Details: screen-specs/README.md.
- `npm run check:spec` rejects a spec that names a component, prop or value the
  system does not have, so an impossible screen cannot be agreed to.
- **The user approves the spec, then the code gets written.** Arguing about zones
  costs a minute; arguing about a built screen costs an afternoon.
- If nothing fits, `template: "custom"` with a written `customReason` — that is
  the escalation point, the same as filing a request in `requests/`.
- A screen that carries a promise also gets `behaviours`: given / when / then in
  the words the requirement was written in, each naming the test that proves it.
  The test carries `<specId>#<id>` in its name, so an agreed behaviour that was
  never built shows up red rather than staying a sentence in a file.

## Enforcement (linters + gate + hooks) — ALWAYS ON, not optional

The rules above are not honour-system. They run automatically on every change.
Industry-standard tools do the general work; one small custom linter covers the
project-specific rules nothing off-the-shelf knows about.

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
- **`lint:graph`** — the RESOLVED import graph (dependency-cruiser): layers
  components → blocks → shell → layouts, atomic ranks, no cycles.
- **`lint:vocab`** — one word per meaning; a union prop name on 2+ components
  must itself be declared in `prop-vocabulary.json`.
- **`npm test`** (vitest + Testing Library + axe) — what only running code can
  prove: every golden example renders and is axe-clean, every variant the
  registry advertises lands as `data-*` in the DOM, and the keyboard/ARIA
  contract of every stateful component (its own `.test.tsx`).
- **`npm run contrast`** — WCAG pairs in both themes, from the token files: the
  curated role pairs AND every pair the CSS paints, since a pair nobody listed is
  a pair nobody measures. Misses are recorded with their ratio and may not get
  worse; a painted pair held lower needs a reason in `exempt`.
- **`size`** — a gzipped bundle budget.
- **`visual`** — every golden example screenshotted in a real browser, both
  themes, against committed baselines (`visual/README.md`). Accept with
  `npm run visual:update`.
- **`lint:dup`** (jscpd) copy-paste, and **`lint:dead`** (knip) dead code — the
  second is a triage tool, not a gate step.
- **`npm run scout`** — what belongs here but sits in an app (see the promotion
  rule). Findings carry a reason and a closing condition, like `ALLOW`.
- **`audit` + `scan:secrets`, and `lint:sast` in every app** —
  advisories with a written decision each; secrets in what git CARRIES; semgrep
  over `src` and over whatever spawns processes or holds keys. A local server
  binds loopback and checks `Origin` on upgrade: WebSockets ignore CORS.
- **`typecheck:next`** — the same project through TypeScript 7, a second opinion
  in every package's gate. `tsc` 5.9 stays THE compiler.
- **`check:spec`** — screen specs match the system (see below).
- **`tokens:check`** — the DTCG export in `tokens/` still matches `styles/`:
  every alias resolves, every value survives a round trip back to CSS, and no
  token is declared twice in one theme with two values.
- **`npm run context`** — the must-read context (AGENTS.md +
  `component-index.md`) has a budget like bundle size; the registry is held to
  a per-entry ceiling.
- **`npm run registry -- <Name>`** — the entry for a component, on demand (see
  "Discovery first"); the whole file is for the linters. The same five answers
  are served over MCP (`npm run mcp`, `mcp/README.md`).
- **`redteam`** — breaks the reference solutions the nine ways agents
  really break code and fails if a break survives. Every other check asks whether
  the code is right; this one asks whether we would notice if it were not. A
  surviving mutation is a hole in the scorer, never a mutation to delete.
- **`eval`** — scores a candidate solution against the system
  (`evals/README.md`): how we tell whether a change to the rules, the registry or
  the examples improved anything.

- **`verify -- <files>`** — instant: real components, real props, no
  inline styles. `--deep` (6s) adds types, render and axe, where two thirds of
  measured failures are. Run it on what you just wrote.

**Wiring — runs always, automatically:**
- `npm run check` runs THE gate: one list in `scripts/gates.mjs`, four lanes at
  once, 37 seconds. `check:ci` comes off the same list, and a step leaves CI only
  by carrying a written reason (today two do: `visual` and `screens`, committed
  PNGs of rendered text). `--list` prints every step and its lane, `--timings`
  where the seconds went, `--from <step>` resumes after a fix, `--serial` puts
  the output back in one stream.
- Edit hook (`.claude/settings.json` → PostToolUse) lints on every `.ts/.tsx/.css`
  edit and blocks the edit on failure.
- Stop hook (`scripts/claude-stop-gate.mjs`) blocks finishing a turn while red.
- git `pre-commit` (`.githooks/pre-commit`, enable with
  `git config core.hooksPath .githooks`) runs the full `npm run check`.

## Component patterns

```tsx
// Wrapping a CSS class with a React component
export function Button({ variant, size, className, ...rest }: Props) {
  return <button
    className={cn('btn', className)}
    data-variant={variant}
    data-size={size}
    {...rest}
  />
}
```
CSS does the work:
```css
.btn { /* base */ }
.btn[data-variant="secondary"] { /* override */ }
.btn[data-size="lg"]           { /* override */ }
```

## Choosing between neighbours

`component-index.md` says what each component is for. These are the pairs that
get confused, where picking the wrong one still compiles, still passes review and
is still wrong:

- Text on hover or focus is `Tooltip`; a card of controls on click is `Popover`;
  a menu is `Dropdown`; a rich card on hover is `HoverCard`.
- `Spinner` marks busy, `Skeleton` holds the shape of content that has not
  arrived, `ProgressBar` shows how far along something is, `Meter` shows a value
  on a fixed scale. Inside a button it is `<Button loading>`, never a bare spinner.
- `Table` (wrapped in `TableScroll`) for a known number of rows, `DataGrid` when
  the count is unbounded.
- `Pagination` when the total is known, `LoadMore` when it is not.
- `Select` for a short list, `Combobox` when it is long enough to type into, and
  `Combobox multiple` for multi-select. A filter above a LIST is neither: that is
  `FilterDropdown`, inside a `FilterBar`.
- `Chip` when each option toggles on its own, `SegmentedControl` when exactly one
  of them can be chosen at a time.
- `Tabs` when there are panels, `SegmentedControl` when there is only a choice.
- `Badge` is a standalone status pill, `CountBadge` pins a number to another
  element's corner, `Chip` is a pill you can select or press.
- `Alert` stays on the page until resolved, a toast from `useToast()` does not.
- `Divider` is the one hairline rule; `DropdownDivider` only exists inside a menu.
- `Field` wraps a label and a control together; reach for `Label` alone only
  outside a Field.
- Page chrome comes from `src/blocks/*Template` plus `PageHeader`. A screen that
  sets its own width, padding or centering is doing the template's job by hand.
- Layout inside a screen is `Stack`, `Row` and `Grid` with token gaps, not raw
  flex or grid declarations in the screen's CSS.

## MUST: built in an app twice means it belongs here

A shared system fails quietly: someone needs a pill or a page skeleton, builds
it inside their app because that is the shortest path, and the next app builds
it again. Both work, the gate stays green, and the system stops being where
components live. So the rule is mechanical:

- **The second time a thing is needed, it moves here.** One app owning a custom
  component is fine; a second app needing it is the promotion trigger.
- **Wrapping is not copying.** An app component that renders a system component
  and supplies the wiring (who the user is, where an entry navigates) is the
  pattern working correctly.
- **`npm run scout` decides, and it runs in the gate.** Close a finding by
  promoting the code or by recording a reason and its closing condition. Never
  by weakening the check.
- **Promotion follows the rules above**: registry entry, `levels.json`,
  `surfaces.json`, a golden example, `gen-registry` in the same turn.

**Creating a new component:** only when none of the above fit. New folder with
`Name.tsx + Name.css + Name.example.tsx + index.ts`, its level added to
`src/components/levels.json`, then `npm run gen-registry` in the same turn. The
linter fails on a component that skips the level or the golden example.

## Component knobs (in settings.css)

For families of components, expose shared knobs:
- `--control-height`, `--control-radius`, `--control-padding-x`, `--control-font-size`, `--control-font-weight` — shared by btn/input
- `--card-radius`, `--card-padding`, `--card-padding-nested`, `--card-shadow`
- `--sidebar-width`

Changing `--control-radius: var(--radius-full)` makes ALL buttons & inputs pills globally.

## Theme

Two blocks in `styles/semantic.css`, not `light-dark()` in the token layer:
`:root` (shared with `[data-theme-lock="light"]`) holds the light role values,
`[data-theme="dark"]` holds the dark ones, and an `@media (prefers-color-scheme:
dark)` block repeats the dark set for a visitor who has chosen no theme.
`ThemeProvider` sets `data-theme` on `<html>`.

```css
:root { color-scheme: light dark; }
[data-theme="light"] { color-scheme: light; }
[data-theme="dark"]  { color-scheme: dark; }
```

That third block is a duplicate by necessity and has drifted twice, which is why
`npm run tokens:check` now fails when the same token is declared twice in one
theme with two different values. `light-dark()` is still the right tool INSIDE a
component's own CSS, where a single declaration needs both values.

## Color naming convention

- Palettes are **hardcoded hex** in `primitives.css`, Tailwind-style stops: `*-50` lightest → `*-900` darkest (`*-0` = white). No formulas, no OKLCH derivation.
- Per-family primary stop: brand `400` (#4638D3 indigo), success `800`, warning `700`, danger `500`, neutral `700` (body text).
- To recolor: replace the hex values in `primitives.css`. To swap palette entirely: replace that file. `semantic.css` maps stops → role tokens (`--primary`, `--background`, etc.).

## Typography scale

One explicit scale (no two-base, no ratio/fluid math) — each step in `settings.css`, tunable independently:
`--font-xs` 12 · `sm` 13 · `base` 15 · `md` 17 · `lg` 20 · `xl` 24 · `2xl` 30 · `3xl` 36 · `4xl` 44 · `5xl` 56 (px).
`base` is body/UI; `md` fills the body→heading gap (large body, subheads).

## Token conventions (where a value lives)

- **Shared scales + component-FAMILY knobs** (space, type, radius, motion, controls, cards, popovers, layout widths, icon/avatar scales) → `settings.css`.
- **Single-component dimensions** (e.g. modal width tiers, switch size, tooltip max-width) → co-located in that component's own CSS (a local custom property on the component root, or an inline value with a short comment). Don't put component-private one-offs in `settings.css`.

## Layout

- App layout: `.app-shell` = grid with sidebar + main
- Page layout: `.page-header` + `.page-content` (in pages-specific CSS)
- Cards/grids: use `--bp-md/lg/xl/2xl` breakpoints (1→2→3→4 columns)

Media queries can't read custom properties, so each `@media` repeats the number.
`lint:rules` fails a width off the `--bp-*` scale.

## Icons

Lucide React, tree-shaken. The name map in `src/components/Icon/Icon.tsx`
keeps Material-Icons-style string names (`add`, `more_vert`, `arrow_drop_down`)
so consumers don't depend on `LucideIcon` component identities. Size is driven
by CSS via `data-size` → `--icon-*` tokens (Lucide's `size` prop is NOT used,
so changing `--icon-sm` in settings actually cascades).

- Default size: `--icon-sm` (16px) — inline with text, in buttons
- Navigation: `<Icon size="md">` (20px)
- Hero: `<Icon size="lg">` (24px)
- Empty state: `<Icon size="xl">` (40px)

## Accessibility (built in)

- `<Dropdown>` — full keyboard nav (Arrow Up/Down, Home/End, Escape), focus trap, focus returns to trigger on close
- Inputs at `var(--font-base)` (>=14px) — iOS Safari zoom acceptable on 14, recommended ≥16 for inputs on iOS
- `prefers-reduced-motion` respected globally (in reset.css)
- `light-dark()` respects `prefers-color-scheme`
- Logical properties used — RTL-ready

## DON'T

- Don't render text under a page title: no subtitle prop exists, on purpose
  (owner's rule, 2026-08-20). What lived there is content — a Descriptions row,
  or nothing; a status Badge rides BESIDE the title (title is ReactNode).
- Don't add SHARED custom properties outside settings/primitives/semantic. Component-private knobs may live in that component's own CSS (see "Token conventions").
- Don't introduce `position: absolute` for layout if grid/flex works.
- Don't use `style={{ ... }}` on JSX except for truly dynamic values (animation positions, portal coords).
- Don't bypass semantic tokens to hit primitives directly — only ad-hoc page layout (and document).
- Don't add child margins that affect parent layout. Use gap on parent, padding on self.
- Don't persist sensitive data (passwords, tokens) to localStorage.
- Don't import upward across atomic levels: molecules → organisms is **forbidden**.

## DO

- Tune settings.css to match a reference design.
- Add new variants via `data-variant` value + CSS rule.
- Compose new behavior from existing components (`<Dropdown>` + `<Button>`).
- Make new things configurable via CSS variables.
- When porting from another design system, write a hex→our-stop mapping table first.

## Known trade-offs

- **Inverted stop naming** vs. Tailwind. Convention is correct but unfamiliar.
- **Single brand-c** for whole brand scale — for two-color brands, use `--gradient-hue-shift` OR hardcode hex.
- **Pixel baselines are machine-specific; the structure baseline is not**
  (`visual/README.md`).
- **The evals are a small sample.** Twelve tasks: evidence, not statistics, and
  one run per task scored ~20 points above three (`evals/BASELINE.md`).
