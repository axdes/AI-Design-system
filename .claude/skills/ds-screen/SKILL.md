---
description: Build a NEW screen or page, in a product or in the design system itself. Use when the user says "add a screen", "new page", "build the settings page", "make a dashboard", or describes a flow to implement. Enforces spec-before-code and building from blocks/templates instead of hand-rolled page chrome.
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
argument-hint: [screen name or the flow]
---

# Building a new screen

## New PROJECT? Content model before the first spec

The first screen of a new app starts one step earlier: write
`packages/design-system/screen-specs/models/<app>.json` (schema in
`screen-specs/content-model.schema.json`, `models/admin-portal.json` is the
worked example). Objects with their core attributes, relations, and the
role-verb-object action matrix — screens are then DERIVED from it: each object
gets its collection and/or detail, each action lands on a screen. `check:spec`
verifies the derivation: named screens exist, action roles are declared, every
core attribute appears on the object's screen, and a spec no object claims is
counted out loud. A noun that fails the litmus test (no instances, no
attributes, no purpose of its own) is a vocabulary — record it as one with the
reason. For a new screen in an EXISTING project, extend that project's model if
it has one; if it does not, skip this step rather than inventing one
retroactively without the user asking.

## Spec first, code second — this is a hard rule for a NEW screen

A tweak to an existing screen does not need a spec. A new screen does.

1. Write `packages/design-system/screen-specs/<id>.json` (format in that folder's README).
   It names the template, the zones, the components in each zone, what the screen
   does when it is empty or broken — and the decisions: `archetype`,
   `primaryQuestion`, per-zone `task` + `data`. When unsure which representation a
   zone gets, ask the MCP `decide` tool (or read `screen-specs/selection-rules.json`)
   BEFORE laying it out: task + data shape in, the representation the rules
   choose out.
2. Run `npm run check:spec`. It rejects a spec naming a component, prop or value the
   system does not have, so an impossible screen cannot be agreed to.
3. **The user approves the spec. Then code.** Arguing about zones costs a minute;
   arguing about a built screen costs an afternoon.
4. If nothing fits, `template: "custom"` plus a written `customReason`. That is the
   escalation point, same as filing in `requests/`.

## Never hand-roll page chrome

Page structure comes from `src/blocks/`, and screens copy an existing layout:

- `ListPageTemplate` — the most common product screen: header, optional toolbar, list/grid, empty state.
- `DetailPageTemplate` — header with back + actions, main column, optional side panel.
- `AuthTemplate` — centered auth card.
- `FormModal` — Modal wrapping a FormStack of Fields with cancel/confirm.

Width, centering and padding belong to the template. A screen that sets its own
page width or re-implements a header is a finding, not a style choice.

## Composition rules

- Pick components from `component-registry.json`. Never invent a prop or a variant
  value: if it is not in the entry's `props[].values`, it does not exist.
- Reach for the primitives table in `packages/design-system/AGENTS.md` before writing
  any `<div>` that behaves like a control: there is already a Chip, a Badge, a Spinner,
  a Skeleton, an EmptyState, a Pagination, a Breadcrumb, a Descriptions, a DataGrid.
- Announce a busy region ONCE (`aria-busy` or one `<Spinner>`), not per shimmer.

## Gotchas

- **`<Spinner>` is the only loading spinner.** Inside a button use `<Button loading>`.
  A hand-rolled CSS spinner fails the custom linter.
- **`<DataGrid>` over `<Table>`** when the row count is large or unbounded: it windows
  the rows. `<Table>` renders everything.
- **`<Combobox>` over `<Select>`** once the list is long; `Combobox multiple` renders
  picks as removable tags.
- **Icon-only controls need BOTH `aria-label` and a `<Tooltip>` wrapper.** The linter
  checks it and it is the single most repeated review comment in this repo.
- **Add/create buttons put the icon on the right** (`iconEnd`) with a creation-type
  icon (`add`, `create_new_folder`, `person_add`). Everything else leads with the icon.
- **Media queries cannot read CSS custom properties.** The `--bp-*` tokens are
  documentation; the literal value is duplicated in the `@media` rule on purpose.
- **In an app, the DS comes in through `@ds` / `@blocks` / `@styles`**, declared in
  BOTH `vite.config.ts` and `tsconfig.json`. If you touch one, touch the other.

## Before you say the screen is done

```
npm run verify -- --deep <the files you wrote>
```

Six seconds, and it answers what reading your own code cannot: are these real
components with real props, does the file typecheck, does it mount, and is what
it mounts accessible. Measured over 27 agent runs, types and rendering were 22 of
39 failures — leave `--deep` off and you are checking the smaller third.
A clean `verify` is not a green gate — `npm run check` still owns types, tests,
accessibility and the visual baselines — but a screen that fails `verify` will
fail those too, later and more expensively.
