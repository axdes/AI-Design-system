# checklist.design audit

External benchmark: https://www.checklist.design. Five categories, 110
checklists, 637 numbered items plus step-by-step flow guides.

The site is a Vite SPA backed by a public JSON API, so the source can be
refetched verbatim instead of copied by hand:

```
curl -s https://www.checklist.design/api/checklists/grouped
curl -s 'https://www.checklist.design/api/checklists/by-slug?slug=button&category=design-system'
```

`grouped` returns the five categories with every checklist slug. `by-slug`
returns `items` (the checklist proper) and `tabs` (illustrated notes; for the
`flows` category the steps live in `tabs` and `items` is empty).

## How the five categories map onto this repo

| Category | Checklists | Where it lands |
| --- | --- | --- |
| `design-system` | 28 | this package: components, tokens, foundations |
| `web-app` | 26 | `screen-specs/` and the apps |
| `website` | 23 | out of scope, no marketing site here |
| `mobile` | 20 | out of scope, no native target |
| `flows` | 13 | cross-screen behaviour: blocks, providers, screen specs |

Only `design-system` is audited item by item below. `web-app` and `flows` are
summarised at the end as screen-level work.

Verdict key: **ok** = covered and verified in code, **partial** = covered but a
named item of the checklist is absent, **gap** = not covered.

Status: two passes on 2026-08-08, both logged in `CHANGELOG-REVIEW.md`. The
first closed the top five entries of Part B (props on components that already
existed). The second added eight components and is written up in Part D. Part A
below is the audit as taken, with closed items marked **done**.

---

## Part A: the 28 design-system checklists

### Foundations

**Tokens** (6 items). Three-tier architecture **ok** (`styles/settings.css`
knobs, `styles/primitives.css` computed, `styles/semantic.css` roles via
`light-dark()`, plus per-component tokens co-located in component CSS).
Naming convention **ok** and enforced by `gen-registry:check`, which fails on
undefined tokens. Governance **ok** (CLAUDE.md states the rule: family knobs in
settings, single-component values co-located). Documentation **partial**: every
token is commented at its definition, but there is no generated token reference
listing purpose and allowed contexts. Design-tool sync **gap** (no Figma
variable export). Versioning and changelog **ok** via `CHANGELOG-REVIEW.md`.

**Color system** (8 items). Primitive palette **ok** (`primitives.css`, 50 to
900 ramps). Semantic tokens **ok**. Interactive state colors **ok**. Feedback
colors **ok** (danger / warning / success / info). Contrast ratios **ok**, the
gate measures them. Dark and light **ok** via `light-dark()`. Brand integration
**ok** (`styles/brands`, `npm run rebrand`). Colour blindness **gap**: nothing
checks that state is carried by more than hue, and there is no simulated-vision
pass in the gate.

**Typography** (8 items). Type scale **ok** (`--font-xs` to `--font-4xl`).
Typeface loading **ok** (`fonts.css`). Line height per style **ok**
(`--leading-*`). Semantic text styles **gap**: the scale is named by size, not
by role, so there is no `body-default` / `label-small` / `caption` layer that
components and agents can select by meaning. Letter spacing per style
**partial**: only `--tracking-wide` exists, there is no per-style value.
Responsive type behaviour **gap** (no fluid scaling or breakpoint overrides on
the scale itself). Minimum readable size **partial** (12px is the floor, but it
is not stated as a rule anywhere). 200% zoom behaviour **gap**, untested.

**Spacing and grid** (7 items). Spacing scale **ok** (4pt grid, `--grid-unit`).
Semantic spacing tokens **partial** (family knobs like `--card-padding` and
`--control-padding-x` exist, but there is no `space-layout-*` vs
`space-component-*` split). Breakpoints **ok** (`--bp-sm` to `--bp-2xl`, named
by size not by device). Component vs layout spacing **partial**, the
distinction is described in CLAUDE.md but not encoded in token names. Column
grid **gap** (no defined column count, gutter or margin per breakpoint).
Density variants **gap** (no compact / comfortable mode). Baseline grid
alignment **partial** (heights are 4pt multiples, text baselines are not
aligned to the unit).

**Icon** (4 items). Responsiveness **ok** (sm / md / lg / xl fixed sizes).
Visual style consistency **ok** (`--icon-stroke: 2` for every icon). Colour
**ok** (currentColor). Naming **partial**: the map in `Icon.tsx` uses literal
names such as `arrow_upward` and `close`, but also action names such as
`edit`, which the checklist warns against.

### Components that exist and are complete

**Accordion** (5 items): header, expand icon, content, states, single vs
multiple. All **ok**, plus keyboard support beyond the checklist.

**Button** (5 items): base style, shape, variants, copy, states. All **ok**
(8 variants, 3 sizes, `loading`, `iconEnd`, block).

**Card** (5 items): style, consistency, spacing, responsiveness, hierarchy.
All **ok**.

**Checkbox** (4 items): label, default selection, style, states. All **ok**,
plus `indeterminate`.

**Radio** (6 items): label, grouping, default, style, clickability, states.
All **ok**.

**Toggle** (3 items): context, transition, state. All **ok** (`Switch`).

**Tabs** (5 items): labels, content area, style, order, states. All **ok**
(`appearance` underline / pills).

**Modal** (6 items): title, action, close, responsiveness, backdrop,
description. All **ok**, plus `placement="drawer"`.

**Skeleton** (5 items): match structure, animation, style, colour, transition.
All **ok** (pulse animation, `shape` text / block / circle, `lines`).

**Loading** (5 items): indicator, text, timing, accessibility, visuals.
**ok** for `Spinner` (has `label`) and `ProgressBar`. Timing policy (when a
spinner is warranted) is a screen-level rule, not a component gap.

**Badge** (3 items): detail, colour, offset position. All **ok** across
`Badge` and `CountBadge` (`dot`, `count`, `max`, overlay offset).

**Input field** (6 items): field, label, placeholder, data format, icon, hint.
All **ok** across `Input`, `Field` (label, required, hint, error, wired with
`aria-describedby`) and `NumberInput`.

### Components with named gaps

**Banner** (6 items) mapped onto `Alert`. Style **ok**, content **ok**, CTA
**ok** (`action`), placement **ok** (consumer decides). Types were **partial**
(four tones against the checklist's five) and dismissable was a **gap**: no
`onDismiss`, so an info or success banner could not be closed. Both **done**:
`neutral` added and `info` moved onto the brand tint, `onDismiss` renders a
close button.

**Toast** (6 items). Lives at `src/lib/ToastProvider.tsx`. Copy **ok**,
placement **ok** (fixed corner region), usage **ok**, variants **ok** (4 tones
with icons), length **ok** (`duration`, queued so bursts stay calm),
dismissable **ok** (close button). Two gaps, both **done**: an `action` slot
(and 8s instead of 4s when one is present, because an Undo that vanishes in
four seconds is a trap), and `role="alert"` for the danger tone instead of the
polite `role="status"` every tone used to get. Still open: no placement choice.
Registering it as a component was considered and **rejected**: `src/lib` is
where the contract puts providers and `gen-registry` reads only
`src/components`, so the discovery gap is closed by the primitives table in
CLAUDE.md instead.

**Tooltip** (4 items). Information **ok**, contrast **ok**, visibility **ok**
(hover and focus, `placement`, `delay`). Dismiss action **gap**: no way to
close a tooltip that stays, and no interactive / persistent variant.

**Dropdown menu** (8 items). Trigger **ok**, dividers **ok**
(`DropdownDivider`), positioning and viewport overflow **ok**. Item anatomy
(no trailing shortcut), groups, destructive styling and keyboard shortcut
display were gaps, all **done**: `shortcut`, `tone="danger"` and
`DropdownSection` added. Two corrections to the first pass of this audit:
disabled items already worked through the native attribute, and the danger
styling already existed in `Dropdown.css` under `data-tone` with no prop to
reach it, so three call sites were writing the attribute by hand. `disabled`
is now `aria-disabled` so a Tooltip can explain the reason, which the native
attribute prevents. Nested submenu is still a **gap**.

**Slider** (5 items). Style **ok**, intervals **ok** (`step`), handles **ok**,
labelling **partial** (`label` and `showValue`, no min / max end labels and no
tick labels), interaction states **ok**. Range (two handles) is in the
component checklist tabs and is a **gap**.

**Date picker** (7 items). Calendar grid **ok** (`Calendar`), text input
alongside **ok** (`DatePicker` is an input plus popover), disabled dates **ok**
(`min` / `max`), locale and week start **ok** (`locale`, `weekStartsOn`).
Today shortcut **gap** (today is ringed in the grid but there is no jump-to
button). Range selection **gap**. Time selection **gap**.

**Avatar** (7 items). This checklist is written around the profile-photo
upload flow, so most items are screen-level. Component-level: placeholder image
**ok** (initials fallback). Status, image error fallback and shape were gaps
(the component's own checklist tabs list Shape / Size / Status / Fallback), all
**done**: `status` + `statusLabel`, `onError` falling back to the initial, and
`shape="square"`.

**Table** (8 items). Header **ok**, sticky header **ok** (`stickyHeader`), row
style **ok**, spacing **ok** (`size`), sort **ok** (`Th sortable` with
`aria-sort`), pagination **ok** (`Pagination`), search and filter **ok** by
composition (`SearchInput`, `FilterBar`, `FilterDropdown`), actions **ok** by
composition. Responsiveness was a **gap** (`Table.css` had no media query and no
scroll container, so a wide table on a narrow viewport had no defined
behaviour); **done** via `<TableScroll label>`.

**Searchbar** (6 items). Input **ok**, label or placeholder **ok**, submit
**ok**, visibility **ok**, and marking the matched substring in a result is
**done** (`Highlight`). Autocomplete and suggestions **partial**: `Combobox`
does typeahead over a fixed option list, but there is no async
suggestions-as-you-type search field. Previous searches **gap**.

**Drawer** (7 items). Two things cover it: `Modal placement="drawer"` (overlay,
Esc, close) and `SidePanel` (inline rail, header, scrolling body, footer).
Placement **partial**: both are right-side only, the checklist calls for left
as well (the app sidebar drawer is separate and lives in the shell). Dimensions
**ok**, overlay **ok**, header **ok**, content area **ok**, triggers **ok**,
footer **ok**.

### Missing outright

**Carousel** (5 items): ways of interaction, progress indicator, dimensions and
alignment, animation behaviour, focused item state. **Done 2026-08-08**: a
scroll-snap track with dots, arrows and an optional autoPlay that is off under
prefers-reduced-motion. The neighbouring slide peeks in, which is what makes the
"focused item state" item mean anything.

---

## Part B: the gap list, ranked

Ranked by how often the gap would actually be hit in the four apps.

1. ~~`Alert` dismissable, plus a neutral tone.~~ **Done 2026-08-08.**
2. ~~`Table` responsive behaviour.~~ **Done 2026-08-08** (`TableScroll`).
3. ~~`Dropdown` destructive, disabled, section label, shortcut display.~~
   **Done 2026-08-08.**
4. ~~`Avatar` status indicator, image error fallback, shape.~~
   **Done 2026-08-08.**
5. ~~Toast action slot and `role="alert"` for the danger tone.~~
   **Done 2026-08-08.** The registry move was rejected, see above.
6. Semantic typography layer (role-named text styles over the size scale).
7. `Tooltip` dismissable variant.
8. `Slider` range mode and end labels.
9. `DatePicker` today shortcut, then range, then time.
10. Search with async suggestions and recent searches.
11. `Dropdown` nested submenu.
12. Carousel.
13. Density variants (compact / comfortable).
14. Column grid definition per breakpoint.
15. Colour-blindness check in the gate; 200% zoom check in the gate.
16. Left-side drawer placement.
17. Icon naming pass (rename action-named icons to literal names).

Items 1 to 5 were additive and low risk. Items 6, 13 and 14 change foundations
and touch every component. Item 17 is a breaking rename.

The context budget is the real constraint on 8, 9 and 12: the first five cost
about 550 tokens of registry between them and used up the headroom, so the
budget was raised once (43k to 44k, and CLAUDE.md 7.0k to 7.2k) with the
reasoning written into `scripts/context-budget.mjs`. The next raise has to be
paid for by a genuine trim.

---

## Part C: web-app and flows

These do not produce components, they produce screens and behaviour rules, so
they belong in `screen-specs/` and in the apps rather than here.

The 26 `web-app` checklists that this repo has no spec for include 2FA,
notification settings, account, help center, billing, user management, admin
panel, onboarding, api keys, integrations, version history, comments,
multi-step form, kanban view, timeline / gantt view, maintenance and feed.

The 13 `flows` checklists are the more useful half, because each one is a
behaviour contract that the design system can enforce rather than a screen:

- **Showing input error**: validate on blur, not while typing; clear the error
  when the field is refocused. `Field` renders the error, but the when is not
  encoded anywhere.
- **Saving changes**: save disabled until dirty, active on change, loading on
  press, confirmation after. `Button` has `loading`; the rest is a pattern.
- **Submitting a form**: submit, loading, success, error, field-level error.
- **Filtering items**: active filters visible, individual and clear-all
  removal, result count, empty state. `FilterBar` covers part of this.
- **Uploading media**: empty state, drag state, progress, constraints,
  outcome, retry / remove, multi-file list. `FileUpload` covers part.
- **Deleting account** and **canceling subscription**: explain consequences
  before confirming. `ConfirmDialog` exists.
- Remaining flows (cart, promo code, payment, verification, password reset,
  support) have no product here that needs them.

The first three are the ones worth turning into system-enforced behaviour,
because every app repeats them.

---

## Part D: the second pass, and what it was based on

The first pass stopped at the components that already existed, on the grounds
that the missing ones had no consumer. That reasoning is circular for a part
that does not exist yet, which is what the owner pointed out. The second pass
therefore went at it from the code rather than from the list: what is already
written by hand, more than once, that a checklist also names.

Three came back, and `npm run scout` misses all three because they hide in a
hook and in formatting functions rather than in component folders:

| Added | What the code showed | Named by |
| --- | --- | --- |
| `CopyButton` | `clipboard.writeText` in 6 places across 5 apps, plus one app's own `useCopy` hook | api-keys, 2FA, invite, press-media |
| `Time` | four independent "N min ago" implementations (one app in three places, another, one app, and a DS lib nothing reaches) | notifications, feed, chat, comments, version-history |
| `PasswordInput` | `type="password"` in 10 places, none of them revealable | login in all three lists, sign-up, settings |

Five more were added where the checklists name them repeatedly and there was
nothing to build a screen out of: `CodeInput`, `Highlight`, `LoadMore`,
`PlanCard`, `Carousel`.

Checked and NOT added, because nothing anywhere hand-rolls them and no checklist
asks twice: a status dot, a settings-row shape, a "danger zone" section, a QR
code, a Gantt view. A kanban board exists once (one app, about 5,500 lines)
and one use is not the promotion trigger.

### What it cost

Nothing, in the end. `props` was the heaviest field in the registry and most of
it was indentation, so the generator now emits one prop per line: 43.4k tokens
to 38.3k with no field dropped. The eight components brought it back to 41.0k,
which is still below where the day started, and the ceilings came back down to
match (registry 42k, total 50k).

### Still open

Everything unticked in Part B, plus the app-side migration this pass did not
do: the six clipboard call sites, the four relative-time implementations and
One app's four password fields are still hand-written. Those live in four
separate repositories with their own gates, and two of them only see any of
this after `npm run vendor-ds`.
