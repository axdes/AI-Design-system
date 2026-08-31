# Design System — System Contract

Math-driven CSS + React component library for LLM-assisted development.
Tune via `styles/settings.css`; never hardcode in components.

**Every path below is relative to this package root** — which is
`packages/design-system` in the monorepo it is developed in, and the repository
root in the published copy. Write paths that way and they resolve in both; the
skills did not, and shipped instructions naming a folder that does not exist
where a stranger reads them (2026-08-28). Products consume the package through
`@ds` / `@blocks` / `@styles`.

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
  128 components you will not use). `npm run gen-registry` writes all of it;
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

Every icon in a button trails the label — one line of CSS, not a choice.
`iconEnd` is an inert leftover; passing it does nothing (owner, 2026-06-10).

## The props every component takes, said once

`className`, `children`, `ref`, `id` and `style` mean the same on all 131 and are
not repeated per component. `className` is ADDED to the component's own classes
and lands on the element it owns — for a wrapped control, the wrapper. Anything
else a caller passes reaches that same element: a component that declares
`inherits` spreads the rest,
which is how an `aria-describedby` from elsewhere on the page arrives.

Every prop that carries a DECISION is documented on the component.

## What this contract points at

Everything below is binding. Everything a task needs only SOMETIMES lives beside
it, one file each, and is named here so any tool can open it by path:

| When you are | Read |
|---|---|
| working out why the gate is red | `docs/contract/enforcement.md` — every check and what it catches |
| looking for where something lives | `docs/contract/file-map.md` |
| choosing between two components that both compile | `docs/contract/choosing.md` |
| writing a component | `docs/contract/component-patterns.md` |
| touching colour or the dark theme | `docs/contract/theme.md` |
| about to propose a change to the system's shape | `docs/contract/trade-offs.md` |

This file was 514 lines on 2026-08-27, which is past the point where a model
stops reconciling instructions and starts picking one. It cost us three months
of a contract teaching a rule the owner had reversed. Keep it short: a fact that
is needed on SOME tasks belongs in the table above, not here.

## MUST: Copy / writing style (UI text, i18n, commits)

- No emojis anywhere (UI strings, code, comments, commit messages) unless the user explicitly asks.
- No AI-isms or filler: avoid "seamless", "effortless", "unlock", "elevate", "dive in", "delve", "in today's world", "whether you're...". Write plain, concrete copy.
- Do not invent product facts, routes, or features in copy. If something is a placeholder, say so plainly.

## MUST: Log every change

After any non-trivial change (a component, a token, a fix with a non-obvious
cause, a refactor across files, a decision that overrides an earlier one), append
an entry to `docs/CHANGELOG-REVIEW.md` saying **what changed and why**, in the same
turn as the change. Typos and mid-session iteration do not need one. Without the
log the next session loses the reasoning and the user cannot trace a decision.

## Stack

Vite + React 19 + TypeScript strict, React Router v7, plain co-located CSS (no
Tailwind, no CSS modules), `lucide-react` behind `src/components/Icon`, and
`react-i18next` (en + ar, RTL through `<html dir>`).

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
be true. Real code means `tsc` breaks when a prop is renamed, the suite renders
it and axe checks it, so the docs cannot drift. `gen-registry` strips the
imports and publishes the usage.

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
- Once the answer IS cards, WHICH card is computed too: the zone declares
  `data.carries` (the content type: entity, metric, request, destination, …)
  and `card` (the family: object, kpi, action, entry, …) from
  screen-specs/card-rules.json, and the gate holds it to the family's parts,
  components and rules.
- A zone that TAKES INPUT is decided the same way: `task: "input"` plus
  `data.commit` (explicit / per-row / autosave / none), `fields`, `context` and
  `familiarity` choose the `form` kind (dialog, panel, page, wizard, draft, …)
  from screen-specs/form-rules.json, and the gate holds it to its parts.
- Once the answer is a TABLE, which table is computed too: the zone declares
  `table` (list, worklist, selection, analytical, pivot, comparison, tree,
  schedule, diff, …) and, when the rows are not plain records, `data.rowUnit`
  plus whichever of `axes`, `cells`, `select`, `nesting`, `aggregate` and
  `rowDetail` apply. screen-specs/table-rules.json picks the kind, names what
  builds it and what it owes; the survey behind it is docs/RESEARCH-TABLES.md.
  A zone may also declare its `columns`, and then screen-specs/cell-rules.json
  applies: each column says what it CARRIES (identifier, identity, money,
  status, measure, actions, …) and the rules decide its alignment, whether its
  width is fixed, whether it may sort and what it owes
  (docs/RESEARCH-TABLE-CONTENT.md).
- A screen may declare `lifecycle` (create / read / update / delete), checked
  against the archetype, and screen-specs/lifecycle-rules.json then decides what
  used to be taste: which detail page (plain / tabs / hub), which shape an edit
  takes (attribute / inline / form), and how hard a destruction is to confirm.
  Reversible deletes get an undo and NOT a dialog — a confirmation over
  something reversible trains people to click through the one that matters.
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

## MUST: one heading outline per screen, and never skip a level

The page title is the only `h1`. Every section heading goes down exactly one step
from what contains it; a level is never skipped to get a size. Size comes from
the component, the LEVEL is the outline, and the outline is how a screen reader
finds anything. Both parts that take it default to safe rather than right:
`<SectionLabel as>` is a plain div without it, `<CardTitle as>` defaults to `h2`
— give both explicitly. A live eval lost 12 points on exactly this before the
contract said it (2026-08-26); `audit:pages` fails on `heading-order`.

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

**Creating a new component:** only when none of the above fit — and then not by
hand. A part lands in twelve places, from the folder to three regenerations; one
command writes all of them and prints the rest in order, and `--remove` reverses
the same pass. Hand-building it half-registers it.

```bash
npm run new -- Name --level molecule --surface card --category actions \
               --about "What it is for and when to reach for it."
npm run new -- Name --remove          # --layer blocks for a block
```

## Component knobs (in settings.css)

For families of components, expose shared knobs:
- `--control-height`, `--control-radius`, `--control-padding-x`, `--control-font-size`, `--control-font-weight` — shared by btn/input
- `--card-radius`, `--card-padding`, `--card-padding-nested`, `--card-shadow`
- `--sidebar-width`

Changing `--control-radius: var(--radius-full)` makes ALL buttons & inputs pills globally.

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

