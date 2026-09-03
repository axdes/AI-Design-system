# Choosing the representation

Before laying out a zone, answer two questions: what does the user DO here (one
verb), and what shape is the data. Those two answers choose the representation.
This is a computation, not a preference, and it is enforced where this system is
developed: a screen spec naming a representation the rules do not permit is
rejected before any code is written.

Generated from `screen-specs/selection-rules.json`. Never edit this file.

## The tasks a collection zone can have

- find
- compare
- scan
- browse
- monitor
- analyze
- process
- navigate

## The representations

### grid

virtualized table: unbounded rows, Excel-like manipulation. The ARIA grid pattern comes with it: one tab stop, arrow keys between cells, Home and End.

Built from: DataGrid

### table

columns over rows: side-by-side comparison, sort and filter by field. WHICH KIND of table (list, worklist, selection, analytical, pivot, comparison, tree, schedule, diff, …) is the next decision down, and screen-specs/table-rules.json computes it from what a row is, what the reader does, how many rows there are and whether a cell interacts.

Built from: Table, TreeTable, PivotTable, ComparisonTable, ScheduleGrid, DiffTable

### list

one row per item, few attributes, linear scanning

Built from: ListItem

### stats

KPI tiles and gauges: values read at a glance

Built from: Stat, Meter, Progress

### cards

self-contained tiles: each item read and judged on its own

Built from: Card, LinkTile, PlanCard

When more than one rule fires, the earlier one in this order wins:
1. grid  2. table  3. list  4. stats  5. cards

## The rules

### R1. Looking up and comparing records wants columns

When task = find | compare, item = record, minFields = 4 → **table or grid**

Two adjacent data points in a column are compared without moving the eyes or holding values in working memory; cards force spatial reorientation per item and de-emphasize ranking (NN/g data tables, NN/g cards).

- right: `<Table stickyHeader><THead>…10 sortable columns…</THead>…</Table>`
- wrong: a Card per user with ten MetaItems — comparing two users now means reading two paragraphs

### R2. Editing at scale is a data grid

When editable = true → **grid**

When cell-level editing is the primary task the surface is a data grid; a plain table carries occasional inline edits only (Smart Interface Design Patterns).

- right: `<DataGrid> with editable cells`
- wrong: a Card per row with an Edit dialog behind every field

### R3. Scanning a few attributes wants rows

When task = find | scan, item = record, maxFields = 3 → **list or table**

With one to three attributes per item a linear list scans fastest; columns earn their chrome only when several fields are compared (uxpatterns.dev: start with list).

- right: `<ListItem> title + one meta line + trailing action`
- wrong: a three-column Table whose header row labels the obvious

### R4. Judging candidates one by one wants tiles

When task = browse → **cards or list**

Browsing has no single target: each item is read and judged on its own content, so it gets a self-contained surface. The moment the job becomes comparing fields across items, the task is compare and R1 applies (NN/g cards: browsing, not searching).

- right: `<Card fill> per team: name, score Badge, the reasons as sentences`
- wrong: a Table whose cells hold sentences — comparison across rows of prose compares nothing

### R5. Monitoring wants preattentive values

When task = monitor, item = metric → **stats**

A monitoring surface is read at a glance and acted on elsewhere: encode quantity with length and position (Stat, Meter), never with prose or rows (NN/g dashboards).

- right: `<Stat size=lg> beside a <Meter> with a target marker`
- wrong: a Table of KPI names and numbers that has to be read line by line

### R6. Analysis drills from aggregate to rows

When task = analyze → **stats or table**

Analysis is one investigation loop: the aggregate on top, the transactional rows under it, acted on where they are (SAP Fiori analytical list page).

- right: `Stat row above the Table it summarises`
- wrong: the aggregate on one screen and the rows behind a navigation

### R7. Prose is never tabular

When item = prose → **cards or list**

A collection of text-heavy items (questions, messages, findings) is read item by item; a table of paragraphs has columns that align nothing (NN/g data tables: tables are for discrete comparable values).

- right: `<Card fill> per question: who asked, the text, the answer, the actions`
- wrong: <Table> with a 'Question' column four lines tall

### R8. A queue is a worklist

When task = process, item = record → **table or list**

Working through items that each need a decision is a worklist: the set is given, so it needs density and status, not discovery chrome (SAP Fiori worklist = list report minus the filter bar).

- right: `<Table> of items with a status Badge and one action per row`
- wrong: a card grid the user has to graze over to find what is next

### R10. A short queue reads as cards

When task = process, item = record, cardinality = few → **cards or list or table**

R8's density argument is about SCALE: with a handful of items, per-item actions and reading beat column density. Two live precedents: the DS ForReview queue (approve / request changes on each card) and a real risk board. At cardinality many, R8 alone applies and cards fail again.

- right: `<Card tight> per item: eyebrow, title, meta, two small actions`
- wrong: a three-row Table whose header chrome outweighs its rows

### R9. Entry points are tiles

When task = navigate → **cards or list**

A hub's items are destinations, not records: a tile per destination with what is waiting inside it (SAP Fiori overview page; LinkTile exists for exactly this).

- right: `<LinkTile> per chat: topic, what is waiting, when it arrived`
- wrong: a Table of destinations with sortable columns nobody sorts

## Never, whatever the task

- **H1** — when cardinality = unbounded, table is forbidden; use grid. Table renders a known number of rows; an unbounded set is DataGrid, which virtualizes (AGENTS.md: choosing between neighbours).
- **H2** — when editable = true, cards and list are forbidden; use grid. Editing as the primary task across a collection needs cells, not a dialog behind every card (Smart Interface Design Patterns).

## Worth saying out loud

- when item = record, maxFields = 3 and you chose table: three fields rarely earn columns — a list scans faster (uxpatterns.dev); keep the table only if column sorting is really used
- when item = record and you chose cards: a view switcher (rows | cards | table over the SAME collection) is the exception, not the default: offer it only when the collection is both VISUAL (the media identifies the item) and COMPARABLE (fields worth columns) — files, media, products; otherwise fix the one representation these rules chose. When offered: an icon SegmentedControl at the toolbar's trailing edge, the rules' choice as the default, the choice remembered per collection, and every view truncating the same ordered field list rather than inventing its own (Fiori list report, SharePoint views, NN/g). The live reference is the showcase's content-patterns screen.
- when task = process, item = record and you chose table: a worklist's READING ORDER IS ITS PRIORITY ORDER: sortable headers (Th sortable/onSort) hand the ranking back to the user and un-decide what the screen decided. Keep headers static; re-sorting is the `list`/`compare` archetypes' tool. Codified 2026-08-21 from the judge lane's first live catch — a fully conformant queue with sortable columns that only the rubric failed.

## Screen archetypes

- **overview** — The entry point of a domain: a glance across two or more sources, and the action itself happens in the places you navigate to. _Not when:_ One data source, or the work happens here — that is a list or a detail.
- **list** — Find and act: search, filter and sort a large set to locate the items worth acting on. _Not when:_ The queue is given and needs processing (worklist), or the items are destinations (hub).
- **worklist** — Work through a given queue: every item needs a decision or a completion, and nobody goes looking for items. _Not when:_ The user still has to find the relevant items first — that is a list.
- **analytical** — One investigation loop: aggregate on top, the transactional rows under it, acted on where they are. _Not when:_ Pure monitoring (overview) or a plain transaction list (list).
- **detail** — One record in full: read it, decide about it, occasionally edit it, in sections. _Not when:_ Several records at once, or a guided first-time creation (wizard).
- **wizard** — A long or unfamiliar creation task, split into sequential revealed steps with a summary at the end. _Not when:_ Two steps, or a routine the user already knows — a wizard there only adds clicks (Fiori).
- **form** — A capture: fields the user fills in and commits. Which KIND of form (dialog, panel, page, draft, settings, …) is the next decision down, and screen-specs/form-rules.json computes it from the field count, the familiarity, the context and the commit model. _Not when:_ Long AND unfamiliar (wizard), or public users under load — they get one thing per page (GOV.UK).
- **auth** — Sign in or sign up: minimal distraction, guarded error copy. _Not when:_ Anything else — an auth page that also lists or explains is two screens.
- **hub** — Entry points to other places: one tile per destination, saying what waits inside it. _Not when:_ The items are records to find or process rather than places to go.
- **settings** — Configuration read rarely and changed deliberately: grouped sections of explained knobs — every row says what it actually affects — found by scanning labels, not by searching. _Not when:_ The 'settings' are really a collection to manage (members, keys as records) — that is a list; or one preference living beside the work it affects, which stays on that screen.
- **system** — The screens around the product: empty start, 404, service unavailable, interruption. _Not when:_ A state a real screen should carry itself (every list already owes its own empty state).
