---
description: Create or change a component in the design system. Use when the user says "add a component", "new component", "build a Toggle/Slider/Table", "change the Button props", "add a variant", or asks for UI that no registry component covers. Covers the full contract: registry check first, levels.json, surfaces.json, golden example, tests, gen-registry, gate.
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
argument-hint: [component name or the need]
---

# Adding or changing a design-system component

Every path here is relative to the design-system package root — `packages/design-system` in the monorepo, the repository root in the published copy.

## Before writing anything: does it already exist?

`component-registry.json` is the source of truth: every component and block with
its real props and the allowed values of every variant. Read it first, and read the
file rather than a count of it — a number in prose here is out of date the day
somebody adds a component, and an agent told there are N will not look for N+1.

- If a registry component (or a composition of them, or a new `data-variant` on
  one) covers the need, use that. Do not hand-roll.
- If nothing fits, file a request in `requests/` (format in `requests/README.md`),
  **stop, and ask the user** to decide: compose / add / reject. Only build after approval.
- `status` on an entry comes from JSDoc: `@experimental` = not for general use,
  `@deprecated` = compat only. Compose from untagged components only.

## The contract a new component must satisfy

Everything below is enforced by `npm run check`; skipping a step fails the gate.

1. **Folder**: `src/components/Name/` with `Name.tsx`, `Name.css`, `Name.example.tsx`, `index.ts`.
2. **Level**: add `Name` to `src/components/levels.json` (atom / molecule / organism).
   Level is metadata, not a folder. The atomic-direction rule reads it from there.
3. **Surface**: add `Name` to `src/components/surfaces.json` (`page` / `region` / `card`).
4. **Golden example**: `Name.example.tsx` exports `Example()` and is a REAL module.
   tsc compiles it, `src/test/examples.test.tsx` renders it, axe checks it, and the
   registry publishes its body to agents. One realistic case beats a gallery of variants.
   Include the required companions (an `IconButton` example includes its `<Tooltip>`).
5. **Tests** for real behaviour (keyboard, ARIA, state), not for what the linter already covers.
6. **Regenerate**: `npm run gen-registry` in the SAME turn as the change.
7. **Gate**: `npm run check`.

## Style rules that differ from a generic React project

- Styling is `className` + `data-*` attributes, and CSS does the work. No inline
  styles except genuinely dynamic values (portal coords, animation positions).
- Only semantic tokens in components (`var(--space-*)`, `var(--font-*)`,
  `var(--radius-*)`, `--primary`, `--foreground`). No raw px, no hex outside
  `styles/primitives.css`, no `!important`.
- Logical properties for RTL: `padding-inline-*`, `border-inline-*`, `text-align: start/end`.
- Import direction follows the level: atom → atoms, molecule → atoms+molecules,
  organism → any component. Never import upward.

## Gotchas (where the obvious move is wrong here)

- **Never edit `component-registry.json` by hand.** It is generated. Hand edits are
  overwritten and `gen-registry:check` fails on the drift.
- **A discriminated union of props breaks the registry parser.** Combobox hit this:
  the component silently lost all its props from the registry. Use one readable
  props type with runtime narrowing instead.
- **`data-x={someLocalConst}` loses the variant.** The generator maps a local const
  back to a prop only when the variable name contains the prop name
  (`resolvedSize` → `size`). Otherwise the variant vanishes from the registry and
  nothing tests it. Name the variable after the prop.
- **A variant that exists in CSS but not in the prop union fails the gate**, and so
  does the reverse. They are checked against each other.
- **Adding a component costs every future task ~280 tokens** of context budget
  (`npm run context`). If the budget is tight, cut per-entry payload before cutting
  components.
- **Component-private dimensions live in that component's CSS**, not in
  `settings.css`. Only shared scales and component-FAMILY knobs go to settings.
- **`npm run visual` renders every golden example in both themes.** A new component
  adds two baselines: accept them with `npm run visual:update` and review the images.

## Copy rules for anything user-visible

No em/en dashes, no emojis, no AI filler ("seamless", "unlock", "elevate"). Plain
concrete wording. This applies to labels, comments and commit messages.
