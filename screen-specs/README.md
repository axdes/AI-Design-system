# Screen specs

The step between "build me the documents screen" and code.

A spec says what the screen is for, which template carries it, what lives in each
zone, and what happens when there is nothing to show or something breaks. It is
cheap to write, cheap to argue with, and unlike a mockup it is **checkable**:

```bash
npm run check:spec                    # every spec in this folder
npm run check:spec -- path/to.json    # one
```

The validator ([scripts/check-screen-spec.mjs](../scripts/check-screen-spec.mjs))
reads `component-registry.json` and rejects a spec that:

- names a template that is not a block (unless `template: "custom"` with a
  written `customReason` — that is the escalation point, not a shortcut);
- names a component that does not exist, or is deprecated;
- pins a prop or a value the component does not have (`Button variant=huge`);
- describes a state without naming the component that renders it;
- has no `empty` state (every list, table and search has one).

So a spec that passes cannot ask for a screen the system is unable to build.

## The flow

1. Agent (or human) writes the spec and runs `npm run check:spec`.
2. **You approve it.** This is the review point: arguing about zones and states
   costs a minute, arguing about a built screen costs an afternoon.
3. Only then does code get written, from the spec, using the named components.

## Format

[schema.json](schema.json) is the contract; editors that honour `$schema` will
autocomplete and validate as you type. [documents-list.json](documents-list.json)
is a filled-in example.

Keep `openQuestions` honest — an empty list is a claim that nothing is unclear,
not a formality.

## `implementation` — the field that makes a spec falsifiable

A spec starts as a wish: it is written before the screen exists, and
`npm run check:spec` only asks whether the system COULD build it — every
component in the registry, every pinned value legal, the template a real block.

Once the screen is built, fill in `implementation` with its path. From then on
the check also asks whether the spec is TRUE: that file has to use the template
and every component the zones name. Without it a spec stays green while the
screen walks away from it, which is what happened to the first one here — it
named a template the screen never adopted, and nothing said so for weeks.

A screen may be more than one module — a page that outgrows the 600-line rule
splits, usually by lifting its card out. `implementation` then takes a LIST of
paths and the check reads them as one screen:

```json
"implementation": [
  "apps/airun/src/layouts/TeamCatalogPage.tsx",
  "apps/airun/src/components/catalog/TeamCatalogCard.tsx"
]
```

Without that, the file-size rule and this one contradicted each other: splitting
the page made every component the card owns read as missing from the screen.

A template that is named as INTENT rather than as fact records why in
`_templateNote`. That turns a red gate into a note printed on every run: the gap
stays visible instead of being edited away, and the screen can only diverge on
purpose.

## The decision fields — what makes a spec RIGHT, not merely possible

Until 2026-08-20 the validator answered "could the system build this" and
"does the code agree", and nothing answered "should it look like this": cards
where the job is comparing fields passed every check. The decision layer closes
that. The spec author declares the judgment, the reviewer approves it, and the
gate holds the components to it — the same division of labour as everywhere
else here: the model supplies inputs, a program computes the verdict.

Per screen:

- `archetype` — what KIND of screen this is (`list`, `worklist`, `detail`,
  `hub`, `auth`, …). Backbone: SAP Fiori floorplans. The checkable part today:
  the archetype must sit on a template that can carry it, and a `worklist` may
  not have a `FilterBar` — a queue you still have to filter is a `list`.
- `primaryQuestion` — the question the user asks first. The first zone that
  declares `answers` must answer exactly this question, verbatim: that is what
  makes "the answer comes first" a check instead of a hope.
- `audience` — `expert | public | mixed`. Experts get density, public users get
  one thing at a time; some rules read this.

Per zone:

- `task` — one verb: `find`, `compare`, `scan`, `browse`, `monitor`,
  `analyze`, `process`, `navigate` (the collection tasks), or `read`, `input`,
  `act` (which no representation rule touches).
- `data` — the shape: `item` (`record | prose | visual | metric`),
  `cardinality` (`one | few | many | unbounded`), `fields` (how many attributes
  matter), `editable` (only when editing IS the task).
- `answers` — the question this zone answers; zone order is answer order.
- `surface` — when the zone is on screen: `page` (always, the default), `tab:<name>`
  (its own context beside the page), `dialog` (covers the rest; a zone named
  `dialogs` defaults to it). This is what makes "one primary action" precise:
  two primaries in one zone are a failure, two on the same surface are named in
  a note, a page primary and a tab primary are different moments and stay quiet.

[selection-rules.json](selection-rules.json) is the brain: the
"Choosing between neighbours" prose of AGENTS.md as data, consolidated from
NN/g, uxpatterns.dev, Smart Interface Design Patterns and Fiori. Each rule is a
condition on task+data, the representations it chooses, and the reason — with a
right and a wrong code fragment, because a rule stated as a pair is the one
form agents demonstrably follow. Highlights: comparing records with 4+ fields
is a table, never cards (R1); prose is never tabular (R7); an unbounded set
forbids `Table` and demands `DataGrid` (H1); one zone pins at most one
`Button variant=primary`.

The engine lives in `scripts/lib/spec-rules.mjs`, shared by the gate, by
`src/test/screen-spec-rules.test.ts` (which proves every check can go RED, on
the planted-defect fixture in `fixtures/wrong-representation.json` — a rules
engine that cannot fail is a hole, not a check), and by the MCP server's
`decide` tool, which serves the same rules as an answer instead of a rejection:
task + data in, the chosen representation with its reason out, a plan of
components checked on the spot. The archetypes live in the same file, each with
use-when / not-when, the blocks that carry it, and the components it forbids or
expects (a worklist forbids `FilterBar`; a list expects it or `SearchInput`).
A collection zone that names no task is counted out loud on every run: the
rules cannot see it, and the count is the debt.

A spec may also carry `acceptance`: short yes/no statements a reviewer can
verify by LOOKING at this particular screen ("a row is one line tall", "only
the rows scroll") — not restatements of rules the gate already checks.
Per-screen criteria measurably beat a universal checklist (SALT's ablation:
dropping them cost 17%), and they are the rubric the future judge lane scores
against, written while the intent is fresh. The summary line counts which
screens carry them.

Two honest limits. The rules fire on declarations, not prose — a task label
chosen to dodge a rule will pass the machine and is exactly what the human
review of the spec is for. And `answers` matching is identity, not paraphrase —
copy the primaryQuestion string, or the check calls it a different question.

## The content model — where screens come FROM

The decision fields judge a screen someone already invented. The layer above
them stops screens being invented at all: for a new project,
`models/<app>.json` (schema: [content-model.schema.json](content-model.schema.json),
worked example: [models/admin-portal.json](models/admin-portal.json)) is written
first, from the requirements — the objects the product is about, their core
attributes, relations, and the role-verb-object action matrix. Screens are then
DERIVED: each object gets its collection and/or detail, each action lands on a
screen. That is the ORCA discipline cut down to what a gate can hold:

- every screen an object or action names must exist as a spec;
- every action's roles must be declared in the model;
- every CORE attribute must appear, textually, in the object's own screen spec —
  a screen that drops part of the object goes red, and so does a model that
  overstates its core;
- a spec that builds into `apps/<id>/` and is claimed by no object is counted
  out loud: a screen the model does not know it has;
- a noun that fails the litmus test (no instances, no attributes, no purpose of
  its own) is recorded in `vocabularies` with the reason, so the split is a
  decision the next session inherits instead of re-litigating;
- an action may carry `provenBy: "<spec>#<behaviour-id>"`, which closes the whole
  chain — requirement, model action, screen behaviour, test — and fails when the
  behaviour does not exist;
- when the object's screen has its implementation checked out, each core
  attribute is looked for in the CODE too (a note, not a failure: code may carry
  the field under another name).

A spec written before any code names its app in `project`, so the model's
tracing sees it; once `implementation` is set, the path carries that fact.

The check runs inside `check:spec` on whole-folder runs, from the same shared
engine, and `fixtures/wrong-model.json` plus the test prove each of these can
go red. Models live here rather than in the apps because the specs they bind to
live here; one model per app, named by the app folder.

## `behaviours` — what the screen DOES

Zones say what a screen is made of, which is the half a registry can check.
`behaviours` is the other half, and it is the half a client's requirement is
actually written in: given, when, then, and the reason it matters.

```json
"behaviours": [
  {
    "id": "failure-moves-nothing",
    "given": "a summarise run that the CLI fails",
    "when": "the screen reports it",
    "then": "the same messages are still listed as waiting, and the watermark has not moved",
    "why": "The one failure this product must not have: messages marked read that were never summarised anywhere.",
    "provenBy": "apps/teams-digest/src/layouts/ChatDetailPage.test.tsx"
  }
]
```

The link is machine-checked, not asserted in prose. The test that proves a
scenario carries `<specId>#<id>` in its name:

```tsx
it("digest-chat-detail#failure-moves-nothing — a failed summary says the messages are still waiting, and they still are", …)
```

`npm run check:spec` fails when a scenario names a test that does not exist or
does not claim it. A scenario nobody has got to yet says so in `pendingReason`
and is printed on every run, with the condition that closes it. What it may not
be is quiet: a spec with no behaviours cannot be wrong, which is exactly why it
is worth so little, and the check prints how many screens are in that state.

Behaviours are optional per screen and the coverage number is not a target to
game. Write them where a screen carries a promise: the ones that are only
structure do not need six sentences saying so.
