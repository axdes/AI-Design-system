# Screens and templates: the research, the gaps, and the naming

Measured against the repository on 2026-08-23. Every number below was counted
out of the source, the registry and `npm run scout`, not remembered.

**Status: sections 1 to 9 are the survey; what has SHIPPED since is** the `Page`
block, `screen-specs/page-rules.json` (11 archetypes, 8 regions, 5 shapes, 4
widths), the gate's rot and drift checks over both, the
`the page wrapper comes from a page block` lint rule with its 16 findings
recorded per app, and **every page template rebuilt on `Page`** —
System, Wizard, Settings, Form, Overview, AdaptiveList, List and Detail, all
pixel-identical, verified against the design system's own baselines, the
showcase's 85 committed screens and teams-digest's 9. `AuthTemplate` is the one
exception and it is a finding, not a gap: it replaces the shell rather than
sitting inside it. Still open: the lifecycle axis and the `ProfilePage`
promotion.

Two questions were asked: **is the screen layer as complete as the card layer
and the form layer**, and **do the template names belong to a design system or
to the projects that happened to need them first**. The answers are no and no,
and the second is the cheaper of the two to fix.

## 1. What the system has today

Thirteen blocks. Nine of them are page skeletons, four are overlays:

| Page skeleton | Archetype it carries | Used by |
| --- | --- | --- |
| `ListPageTemplate` | list, worklist, hub | 12 screens |
| `AdaptiveListPage` | list, hub (welcome state) | 6 |
| `DetailPageTemplate` | detail | 6 |
| `AuthTemplate` | auth | 6 |
| `OverviewPageTemplate` | overview | 2 |
| `FormPageTemplate` | form | 2 |
| `SettingsPageTemplate` | settings | 1 |
| `SystemPageTemplate` | system | 0 |
| `WizardTemplate` | wizard | 0 |

| Overlay | Used by |
| --- | --- |
| `FormModal` | 11 |
| `ConfirmDialog` | 11 |
| `RenameDialog` | 3 |
| `FormPanel` | 0 |

Eleven archetypes are declared in `screen-specs/selection-rules.json`:
overview, list, worklist, analytical, detail, wizard, form, auth, hub, settings,
system. Twenty-two screen specs exist across the products.

## 2. The measurement: what actually gets built

- **54 real page modules** across the eight products. **37 use a template, 17
  do not** — a third of every screen in the estate is page chrome written by
  hand.
- **16 files re-declare `className="page-content"` themselves.** That class is
  the templates' own inner wrapper. When a template does not fit, people do not
  file a request; they rebuild its innards out of divs.
- **7,931 lines of bespoke layout CSS** in the apps' `layouts/` folders against
  **708 lines** in all thirteen templates. The system supplies one line of page
  CSS for every eleven the products write.
- **`npm run scout`'s largest accepted duplication group is page chrome**:
  1,651 lines / 42 clones between a product and the showcase, all in `layouts/`.
  The written reason is "the design system owns these screens as its showcase",
  which is true and also means the duplication is the system's own.
- `ProfilePage` exists **three times** across products and the showcase — 180,
  202 and 198 lines, near-identical, each with its own `profile-header`,
  `profile-avatar-wrap`, `preference-row` CSS. Second use is the promotion
  trigger; this is the third.
- **Three of thirteen blocks are idle**: `FormPanel`, `SystemPageTemplate`,
  `WizardTemplate`. Two of them (system, wizard) are archetypes every product
  eventually needs, so idle here means "nobody reached for it", not "nobody
  needs it".

## 3. Where the decision layer stops

Cards and forms are computed and enforced. Screens are only half enforced.

`checkArchetype` in `scripts/lib/spec-rules.mjs:137` reads:

```js
if (a.templates?.length && spec.template && spec.template !== 'custom' && !a.templates.includes(spec.template))
```

An archetype whose `templates` array is **empty skips the check entirely**. Two
of the eleven are empty today:

- `overview` — `templates: []`, although `OverviewPageTemplate` exists and two
  specs use it. The rule was written before the template and never caught up.
- `analytical` — `templates: []`, and no template exists at all. The archetype
  is declared, described, sourced to the Fiori analytical list page, and then
  points at nothing.

`worklist` and `hub` both point at `ListPageTemplate` / `AdaptiveListPage`,
i.e. they are list pages with rules bolted on (`worklist` forbids `FilterBar`).
That is a legitimate design, but it means four of eleven archetypes have no
skeleton of their own, and the one enforcement they get is a forbidden
component.

**Fix, and it is small:** treat an empty `templates` array as an error in the
rules-file rot check, the same way `card-rules.json` and `form-rules.json`
already reject a family or kind built from a component the registry lacks.
An archetype with no template is either a gap to fill or a `status: "planned"`
with the condition that opens it — never a silently skipped check.

## 4. The taxonomy gap: what the canon has and this system does not

Sources: SAP Fiori floorplans (overview, list report, worklist, analytical list,
object page, wizard, flexible column layout), NN/g page-type research, and the
pattern sets of Carbon, Polaris and Atlassian. Every "who needs it" column below
is a screen that exists in this repository today, hand-rolled.

| Missing archetype | Already needed here | Nearest part we own |
| --- | --- | --- |
| **split view** (list and detail side by side, one column collapsing) | transcript `SessionPage`, teams-digest chat detail, every mail-shaped screen | nothing — `DetailPageTemplate.aside` is a rail, not a pane |
| **board** (columns of movable cards) | workshops `WorkshopBoardPage`, **1,806 lines** | `Card`, `CardStack` |
| **reader** (long text, table of contents, find-in-page, per-paragraph actions) | workshops `TranscriptReaderPage`, transcript `SessionPage` | `Quote`, `Timeline` |
| **profile / account** | three apps, copied | `Identity`, `Avatar`, `SettingsPageTemplate` |
| **live session / console** (a thing happening now, with controls) | `ActiveCallPage`, `ConsolePage`, `RecordPage` across three products | `SessionPill`, `Meter` |
| **analytical** (aggregate over the rows it summarises) | declared archetype, no template | `Stat`, `Table`, the chart atoms |
| **conversation page** | three screens use `ChatShell` directly | `ChatShell` is an organism, not a page |
| **calendar / schedule page** | none yet | `Calendar`, `ScheduleGrid` |
| **feed / activity page** | none yet | `Timeline` |
| **search results** | none yet | `SearchInput`, `Highlight` |
| **comparison / plan page** | none yet | `ComparisonTable`, `PlanCard` |
| **print / export view** | a workshop export, a record export | nothing |

The first six have live evidence in this repository. The last six do not, and
by this system's own second-use rule they stay unbuilt and recorded.

## 5. Why templates get abandoned — the flexibility finding

The templates are well made; they are not flexible, and the reason is
structural rather than a matter of missing props.

1. **Every template is all-or-nothing.** Between `AppLayout` (the shell: nav
   column plus scrolling main) and a full page template there is nothing. A
   screen that needs a shape the nine templates do not have has no system parts
   to assemble one from, so it assembles one from `<div>`s. That is precisely
   what the 16 hand-written `page-content` wrappers are.
2. **One column, fixed slots.** No template offers a **sub-navigation slot**
   (six screens use `Tabs` as page navigation; `DetailPageTemplate` mentions
   tabs only in a comment), a **sticky action footer** (five app stylesheets
   hand-roll one), a **second pane**, a **full-bleed region**, or a
   **bottom sheet**.
3. **The escape hatch exists in the spec and not in the code.**
   `template: "custom"` plus a written `customReason` is the agreed escalation
   in `screen-specs`, but an app that goes custom leaves the system entirely —
   no wrapper, no width cap, no empty-state contract, no visual baseline.

**The proposal: two layers, not one.**

*Layer A — page primitives (composable, unopinionated).* `PageShell` with
header / body / optional rail / optional footer-bar slots; a `PageBody` whose
shape is a prop (`single | split | rail | board | canvas`); `PageSection`.
Every existing template is then rebuilt as a composition of these, which is
also the proof that they are sufficient.

*Layer B — archetype templates (opinionated presets over Layer A).* Exactly
what exists today, plus the archetypes from section 4, each one a short file
because Layer A carries the geometry.

That is what "adaptable to any layout quickly" means concretely: a shape the
system has not met yet is composed **from system parts** in one screen, and if
a second screen needs the same shape, it is promoted to Layer B. Today that
path does not exist, so the fallback is divs, and the divs never come back.

## 6. Naming: the audit

Thirteen blocks carry **six suffix conventions**:

| Suffix | Blocks |
| --- | --- |
| `*PageTemplate` | ListPageTemplate, DetailPageTemplate, OverviewPageTemplate, FormPageTemplate, SettingsPageTemplate, SystemPageTemplate |
| `*Template` | AuthTemplate, WizardTemplate |
| `*Page` | AdaptiveListPage |
| `*Modal` | FormModal |
| `*Panel` | FormPanel |
| `*Dialog` | ConfirmDialog, RenameDialog |

Four separate problems:

1. **The suffix carries no meaning.** `Template` and `PageTemplate` and `Page`
   name the same thing. `Modal` and `Dialog` name the same thing, while the
   primitive they compose is called `Modal`.
2. **Two names describe a mechanism, not an archetype.** `AdaptiveListPage`
   says how it behaves (it adapts); `SystemPageTemplate` says nothing at all to
   anyone who has not read the description — the screens it carries are
   not-found, unavailable, and broken.
3. **One name is a use case, not a pattern.** `RenameDialog` is the single-field
   prompt. A design system does not own "rename"; it owns "ask for one value".
4. **The names do not match the archetype vocabulary they implement.** The
   archetypes are `list`, `detail`, `overview`; the templates are
   `ListPageTemplate`, `DetailPageTemplate`, `OverviewPageTemplate`. The mapping
   is written by hand in `selection-rules.json` and, as section 3 showed, it
   rots. If the name **is** the archetype, the mapping is derivable and cannot
   rot.

There is no naming convention documented anywhere. `AGENTS.md` has a colour
naming convention and `lint:vocab` enforces one word per meaning **for props**.
Component and block names have neither.

### The rule

> A page skeleton is named `<Archetype>Page`, where `<Archetype>` is the
> archetype id from `selection-rules.json`, capitalised. An overlay is named
> `<Purpose><Container>`, where `<Container>` is the primitive it composes
> (`Modal`, `Panel`, `Popover`).

### The rename

| Now | Proposed | Why |
| --- | --- | --- |
| `ListPageTemplate` | `ListPage` | archetype `list` |
| `DetailPageTemplate` | `DetailPage` | archetype `detail` |
| `OverviewPageTemplate` | `OverviewPage` | archetype `overview` |
| `FormPageTemplate` | `FormPage` | archetype `form` |
| `SettingsPageTemplate` | `SettingsPage` | archetype `settings` |
| `WizardTemplate` | `WizardPage` | archetype `wizard` |
| `AuthTemplate` | `AuthPage` | archetype `auth` |
| `SystemPageTemplate` | `StatusPage` | it carries 404 / unavailable / broken; "system" names nothing. Archetype renamed with it |
| `AdaptiveListPage` | `HubPage` | it is the entry-point shape (welcome, tiles, one CTA) that grows into a list — archetype `hub`, which today has no skeleton of its own |
| `FormModal` | `FormModal` | unchanged; the primitive is `Modal` |
| `ConfirmDialog` | `ConfirmModal` | same primitive, same suffix |
| `RenameDialog` | `PromptModal` | one value asked for, not one use case |
| `FormPanel` | `FormPanel` | unchanged; the primitive is `SidePanel` |

Renaming `AdaptiveListPage` to `HubPage` is the one judgement call: today it is
used for both a hub and a list-that-starts-empty. If those two really are one
shape, `HubPage` is right and the welcome state is its empty state. If they are
two, this is the moment to split them.

### The cost, measured

Files mentioning a block name, excluding `node_modules`, `dist` and `reports`:

- **65 app source files** — the only hand-edited surface, and mechanical.
- **~200 files in the package** — source, examples, specs, tests, docs.
- **17 generated files** (registry, `component-index.md`, `llms.txt`) —
  regenerate themselves.
- **193 vendored files** in the products that carry a snapshot — regenerated by
  `npm run vendor-ds`, free.

The real cost is not the sweep, it is that seven of the products are **separate
git repositories**: the rename has to land in each clone. That argues for doing
it in one pass, with the old names kept as deprecated re-exports for exactly one
release, and a gate step that fails on the old name once the aliases go.

## 7. What to do, in order

**P1 — cheap, and it stops the rot (a day).**
1. Make an empty `templates` array a rules-file error. Fill `overview`
   (`OverviewPageTemplate`) and mark `analytical` `planned` with its condition.
2. Give `worklist` and `hub` their own entries with the template they really use.
3. Promote `ProfilePage` — three copies, ~580 lines, the largest single item in
   the accepted-duplication list.
4. Do the rename of section 6 with aliases, and write the naming rule into
   `AGENTS.md` next to the colour convention. Extend `lint:vocab` to names.

**P2 — the flexibility layer (the substantial piece).**
5. Build Layer A: `PageShell` with Primer's regions (header, content, pane,
   footer, sidebar) and Primer's props, and `PageBody` with a `shape` of
   `single | list-detail | supporting | feed | board | canvas`, plus a sticky
   footer-bar slot and a sub-navigation slot. Section 8.2 and 8.3 say why the
   vocabulary is borrowed rather than invented.
6. Rebuild the nine existing templates on top of it. If a template cannot be
   expressed in Layer A, Layer A is wrong — that is the acceptance test.
7. Add a lint rule: a page module in `layouts/` that declares `page-content`
   itself is a finding, the way raw px and hex already are.
8. Add the lifecycle axis to `selection-rules.json` and with it the split-view
   rules from Cloudscape (never instead of a details page; side panel at five
   columns or fewer, bottom panel above; empty state when nothing is selected).

**P3 — the archetypes with live evidence (each on its own second-use trigger).**
9. `BoardPage` (workshops), `ReaderPage` (workshops, transcript), `ConsolePage`
   (three across two products), `AnalyticalPage` (declared, unbuilt), and the detail
   variants `DetailPage` with tabs and as a hub (six screens hand-roll the tabs
   one today). Split view is **not** here any more — 8.4 moved it into Layer A.
10. Record the remaining six of section 4 as `planned` with the condition that
   would open them, the way `form-rules.json` records its P3 kinds.

## 8. What the rest of the industry does (external research, 2026-08-23)

Nine systems were read for this section: GitHub Primer, Shopify Polaris,
Atlassian, AWS Cloudscape, SAP Fiori, Material 3 / Android, GOV.UK, Ant Design
Pro and the shadcn ecosystem, plus EightShapes on naming. Sources at the end.

### 8.1 Nobody suffixes a page skeleton with `Template`

| System | What the page skeleton is called |
| --- | --- |
| GitHub Primer | `PageLayout` with `.Header` `.Content` `.Pane` `.Footer` `.Sidebar` |
| Atlassian | `PageLayout` (now deprecated in favour of the navigation system's `Layout`) |
| Shopify Polaris | `Page` |
| AWS Cloudscape | `AppLayout` |
| Ant Design Pro | `ProLayout` + `PageContainer` |
| GOV.UK | patterns named by their job: "Question pages", "Confirmation pages", "Page not found pages", "Service unavailable pages", "Interruption pages" |
| SAP Fiori | "floorplans": List Report, Object Page, Analytical List Page, Overview Page, Wizard |

`Template` as a suffix comes from atomic design, where a template is the page
structure without real content and a page is a template with content. By that
definition our blocks genuinely are templates — and no shipping system names
them that way. Nathan Curtis argues the reason directly: pick names that make
sense to the most people, and keep the atomic metaphor out of the label because
it "sometimes gets in the way". Our registry already carries `level: "block"`,
so the atomic meaning is recorded in the field that is meant to record it and
does not need to be repeated in every name.

This supports the section 6 rule, with one refinement borrowed from GOV.UK:
name the page after **the job it does**, not after the mechanism. That is
another argument for `StatusPage` over `SystemPageTemplate` and for `HubPage`
over `AdaptiveListPage`.

### 8.2 The two-layer proposal is the industry's settled answer, and the region vocabulary already exists

Shopify diagnosed our exact problem in public. Discussion #7195 on
`polaris-react` records that the `Page` component was not flexible enough, that
"overly opinionated monolithic components create confusion about when to use
one component versus another", and that the fix was a set of layout primitives
(Box, Card, Stack, Inline, Tiles, Columns, ContentBlock, Bleed) taken from
Braid. A parallel discussion (#6454) notes `Page` was used 366 times in the
admin and proposes breaking it into guidance plus a composable header pattern.

Primer's `PageLayout` is Layer A already built, and its prop vocabulary is worth
copying rather than inventing:

- root: `containerWidth: 'full' | 'medium' | 'large' | 'xlarge'`,
  `padding`, `rowGap`, `columnGap`, each `'none' | 'condensed' | 'normal'`
- `Pane`: `position: 'start' | 'end'`, `width` as a preset **or**
  `{ min, max, default }`, `sticky`, `resizable` (persisted), `divider`, `hidden`
- `Sidebar`: same, plus `responsiveVariant: 'default' | 'fullscreen'`
- `divider` and `hidden` accept a **responsive object**, so a region's behaviour
  per breakpoint is a prop rather than a media query in app CSS

Cloudscape's `AppLayout` names the same idea with regions for navigation,
content, tools, split panel, breadcrumbs, notifications and drawers.

Note what this does **not** mean for us: Polaris's list (Box, Stack, Inline,
Tiles, Columns, Bleed) is the spacing layer, and we already have it (`Layout`,
`Card`, `FormStack`, `ListCluster`). What we are missing is only the
**page-region layer** — header, body, pane, footer bar, sidebar. That makes P2
considerably smaller than it first looked.

### 8.3 Body shapes: the canon says three, and gives them names

Material 3 and Android define exactly three canonical layouts, and ship a
scaffold for each:

| Canonical layout | What it is | Compact | Medium | Expanded |
| --- | --- | --- | --- | --- |
| **list-detail** | explorable list beside the selected item's detail | list **or** detail | one at a time | both |
| **supporting pane** | main content with a secondary area beside it | supporting pane hidden or in a sheet | 50 / 50 | 70 / 30 |
| **feed** | a grid of equivalent items, browsed | one column | multi-column grid |

The rationale is coverage: three shapes reach most applications and are simple
enough to be implemented once, as `ListDetailPaneScaffold`,
`SupportingPaneScaffold` and an adaptive grid.

This is better than the shape list section 5 proposed off the top of the head.
`PageBody`'s `shape` prop should use the canon's words —
`single | list-detail | supporting | feed` — with `board` and `canvas` added as
ours, since neither is in the canon and both exist in this repository.

### 8.4 Split view is not an archetype, it is a layout that hosts archetypes

This is the finding that changes the plan.

Fiori's **flexible column layout** "displays multiple floorplans on a single
page" and every floorplan except the overview page can be placed inside it.
That is, the two-column list-plus-detail shape is not a floorplan of its own —
it is a container that hosts a list report and an object page side by side.

So `SplitViewPage` should **not** be a new archetype template. It is a Layer A
capability: `PageBody shape="list-detail"` hosting two existing archetypes. One
capability replaces one archetype and generalises across all of them.

Cloudscape adds the rules that go with it, and they are exactly the kind our
`selection-rules.json` is built to hold:

- a split view "should never replace details pages in the information
  architecture" — it is for identifying, monitoring and comparing while
  browsing, not for analysing one record
- panel **at the bottom** for tables with more than five columns, **at the side**
  for five or fewer
- the panel shows an empty state when nothing is selected

Microsoft's list/details guidance adds the responsive rule: stacked when space
is short, side by side when it is not — the same thing Material says.

### 8.5 Our archetype axis is one of two, and we are missing the other

Cloudscape organises page-level patterns by the **resource lifecycle**, not by
shape:

- **View resources**: Table view, Card view, Split view, Table with nested
  resources, Table with grouped resources
- **Resource details**: Details page, Details page **with tabs**, Details page
  **as a hub**
- **Create resource**: Single page create, Multipage create, Sub-resource
  create, Defaults
- **Edit resource**: Page edit, Inline edit, Attribute editing
- **Delete**: One-click delete, Delete with simple confirmation, Delete with
  additional confirmation

Three gaps fall straight out of that list:

1. **Detail variants.** We have one `DetailPageTemplate`. Cloudscape has three,
   and the "with tabs" one is the variant six of our screens hand-roll with
   `Tabs`. "As a hub" is a detail page whose job is to route onward.
2. **Delete has no decision.** `ConfirmDialog` is one component with no rule
   about which of the three confirmations a given destruction earns. The card
   layer and the form layer both compute their choice; deletion does not.
3. **Edit has three shapes** (page, inline, attribute) and `form-rules.json`
   reasons about capture, not about editing an existing record in place.

The clean way to hold this: `selection-rules.json` keeps the **shape** axis, and
gains a **lifecycle** axis (`create | read | update | delete`) so a spec says
what the screen does to the resource as well as what shape it takes. That is a
data change, not new components.

### 8.6 The AI angle: our bet is rules, and it only pays if the archetypes cover reality

The market answer for agent-built screens is volume: the shadcn ecosystem
advertises thousands of blocks across dozens of categories, reachable by Claude
Code, Cursor and v0 through MCP. Figma's position is that a design system needs
an MCP server exposing components, tokens, code mappings and naming conventions
so an agent stops guessing.

We already have the harder half of that — a registry, an MCP server, and
`decide` tools that compute the card and the form rather than listing options.
What this research says is that the screen layer is the one decision we expose
as prose. An agent asking "which page is this" gets eleven archetypes, four of
which have no skeleton and two of which silently skip their own check. A small
rule-driven set beats a large catalogue for an agent only while the set actually
covers the shapes that come up; sections 4 and 8.5 are the list of where it does
not.

## 9. What changed in the plan after the external pass

- **Split view leaves P3 and joins P2.** It is a `PageBody` shape, not a
  template. Same for the supporting pane, which is what
  `DetailPageTemplate.aside` already half-is.
- **The shape vocabulary comes from the canon**: `single | list-detail |
  supporting | feed`, plus `board` and `canvas` as ours.
- **The region vocabulary and props come from Primer**: header / content / pane
  / footer / sidebar, with `position`, `width {min,max,default}`, `sticky`,
  `resizable`, `divider`, `hidden`, and responsive objects instead of app-side
  media queries.
- **A lifecycle axis joins the rules file**, and with it the detail variants
  (tabs, hub), the three edit shapes and the three delete confirmations.
- **The naming rule gains a second clause**: name the page after its job, not
  its mechanism (GOV.UK), and keep the atomic metaphor in `level`, not in the
  name (EightShapes).

## Sources

- [Primer PageLayout](https://primer.style/components/page-layout)
- [Polaris discussion #7195: primitive layout components](https://github.com/Shopify/polaris-react/discussions/7195)
- [Polaris discussion #6454: Page component flexibility](https://github.com/Shopify/polaris-react/discussions/6454)
- [Atlassian page layout (deprecated) and navigation system](https://atlassian.design/components/page-layout/)
- [Cloudscape patterns](https://cloudscape.design/patterns/)
- [Cloudscape split view](https://cloudscape.design/patterns/resource-management/view/split-view/)
- [Cloudscape AppLayout](https://cloudscape.design/components/app-layout/)
- [SAP Fiori floorplans and page layouts](https://www.sap.com/design-system/fiori-design-web/v1-136/page-types/floorplan-overview)
- [Material 3 canonical layouts](https://m3.material.io/foundations/layout/canonical-examples/overview)
- [Android canonical layouts in Compose](https://developer.android.com/develop/ui/compose/layouts/adaptive/canonical-layouts)
- [GOV.UK Design System patterns](https://design-system.service.gov.uk/patterns/)
- [Microsoft list/details pattern](https://learn.microsoft.com/en-us/windows/apps/develop/ui/controls/list-details)
- [Ant Design Pro PageContainer](https://procomponents.ant.design/en-US/components/page-container/)
- [Nathan Curtis, On Classification in Design Systems](https://eightshapes.com/articles/on-classification-in-design-systems/)
- [Figma: design systems and AI/MCP](https://www.figma.com/blog/design-systems-ai-mcp/)
- [GC Design System page templates](https://design-system.canada.ca/en/page-templates/)
