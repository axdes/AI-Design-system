# Tables: the research, the rules, and what this system is missing

Measured against the registry and the source on 2026-08-23. Every "have" below
was read out of `registry/*.json`, `src/components/Table/*` and
`src/components/DataGrid/*`, not remembered. Every "missing" is a grep with
zero hits, quoted where it matters.

**Status: P1, P2 and P3 of section 6 were all built the same day** (owner's
call), so every gap this survey found is closed and the rules are in the gate:
`screen-specs/table-rules.json` plus `check:spec`, `TableToolbar`,
`BatchActions`, `ColumnPicker`, `TreeTable`, `PivotTable`, `ComparisonTable`,
`ScheduleGrid`, `DiffTable`, `useRowSelection`, and on `Table` itself `caption`,
`scope`, `TFoot`, `stickyColumn`, `TrGroup`, `TdExpand`, `TrDetail`,
`TableEmpty`, `TableSkeleton` and the heatmap cell. `DataGrid` gained the grid
keyboard its role was already claiming, sorting, editable cells and an empty
state. The live reference is the showcase's `tables` screen, one exhibit per
kind. What the survey says below is what was true before that work; the
"missing" column is kept as the record of why each part exists.

This is the third decision layer, and it sits exactly where the other two left
off. `selection-rules.json` answers WHICH REPRESENTATION a collection gets
(table, grid, list, cards, stats). `card-rules.json` answers WHICH CARD once
the answer is cards. `form-rules.json` answers WHICH KIND OF FORM once the
answer is a capture. Nothing answers WHICH KIND OF TABLE once the answer is a
table, and the answer matters more here than anywhere else: a worklist, a
comparison matrix, a spreadsheet and a totals report are four different objects
that all render as rows and columns, and today the system offers one component
for all four and one prop (`nowrap`) to tell them apart.

## 1. What the system has today

| Need | Have |
| --- | --- |
| Rows and columns | `Table` (organism) with `TableScroll`, `THead`, `TBody`, `Tr`, `Th`, `Td` |
| Density | `size="sm"` (font-xs, space-2/3) or default md (font-sm, space-3/4). Two steps, height derived from padding |
| Header that stays | `stickyHeader` (sticks to the nearest scrolling ancestor, so the wrapper needs a block size) |
| One record per line | `nowrap` (cells refuse to wrap, rows centre their content, the row claims width) |
| Sorting | `Th sortable / sortDirection / onSort`, correct `aria-sort`, the arrow faint until the column is active |
| Alignment | `Th align` and `Td align` (`start` / `end` / `center`); `end` also gets `tabular-nums` |
| Cell emphasis | `Td emphasis` (the identifier column), `Td tone` (success / warning / danger fills) |
| A picked row | `Tr selected` (`aria-selected`, `--accent-soft`) |
| Columns that do not fit | `TableScroll label` (a labelled `region`, `tabIndex={0}`, `overscroll-behavior-x: contain`) |
| Unbounded rows | `DataGrid` (windowed, fixed `rowHeight`, `role="grid"`, `aria-rowcount` / `aria-rowindex`) |
| One record's fields | `Descriptions` (a real `dl`, stacked or inline, 1 to 3 columns) |
| Hierarchy | `Tree` (the ARIA tree pattern, one column of labels) |
| Around the table | `FilterBar`, `FilterDropdown`, `SearchInput`, `Pagination` (known total), `LoadMore` (unknown total), `EmptyState`, `Skeleton`, `Checkbox` (with `indeterminate`), `Dropdown`, `ContextMenu`, `Badge`, `Tag`, `Sparkline`, `Meter`, `ProgressBar` |
| A page to put it on | `ListPageTemplate`, `AdaptiveListPage`, `Card flush` (the table bleeds to the card frame, the outer columns keep the card's padding) |

Usage: 62 `<Table` and 19 `<DataGrid` call sites across the monorepo, counting
the vendored copies and the eval fixtures.

Gaps visible from the source alone, each one a grep:

- **No `caption`, no `scope`.** Zero hits for either in the whole component. A
  column header is a `th` whose scope the browser infers; a row header cannot
  be declared at all, and the table has no accessible name unless the author
  remembers `aria-label` on it (`TableScroll` names the scroll region, which is
  a different object).
- **No `TFoot`.** The exports are `Table, TableScroll, THead, TBody, Tr, Th, Td`.
  A totals row is a body row pretending, so it scrolls away with the data and
  reads to a screen reader as one more record.
- **No selection column and no batch bar.** `Tr selected` paints a row. Nothing
  ships the checkbox column, the tri-state select-all, the count, or the bar of
  actions that appears once something is picked. Every product that needs it
  hand-rolls it.
- **`DataGrid` claims `role="grid"` and ships no keyboard.** Zero hits for
  `tabIndex` and `onKeyDown` in the file. The APG grid pattern is a composite
  widget: one tab stop, arrow keys between cells. This is a static table wearing
  a grid role, which is worse than the plain role would be.
- **The rules promise editing the system does not have.** `selection-rules.json`
  R2 sends "editing at scale" to `grid`, and H2 forbids cards and lists when
  `editable` is true, "instead: grid". `DataGrid` has no editable cell. The one
  place the decision layer commits to an answer, the answer is not built.
- **No table toolbar.** Search, filters, the row count, the view controls and
  the table's own actions have no object that binds them to the table they act
  on. `FilterBar` sits above a list, not over a table.
- **No expandable row, no grouped rows, no tree table.** `Tree` is a list of
  labels, not a hierarchy with columns.
- **No column control.** No visibility toggle, no reorder, no resize, no density
  switcher, no sticky first column (the header sticks, the anchor column does
  not).
- **No aggregation and no matrix.** No subtotal row, no pivot, no crosstab, no
  heatmap cell (`Td tone` is semantic, not scalar), no bar in a cell.
- **No states of its own.** `EmptyState` and `Skeleton` exist and nothing
  composes them into a table, so an empty table is an empty `tbody` and a
  loading one is a jump.

## 2. The taxonomy: twenty kinds of table

A table is picked by four questions, in this order.

1. **What is a row?** A record (data tables), a field of one record (key-value),
   or a cell at the crossing of two axes (matrix).
2. **What does the reader do?** Read, find, compare, process, edit, analyse.
   This is the same verb list `selection-rules.json` already uses.
3. **How many rows?** Known and small (up to about 25), paged (hundreds),
   unbounded (thousands and no ceiling).
4. **Does a cell interact?** No: it stays an ARIA table. Yes: it becomes a grid,
   and it owes the grid keyboard model.

| # | Kind | A row is | Use when | Do not use when | This system |
| --- | --- | --- | --- | --- | --- |
| 1 | Reference table | a fact | Static content read once: rates, limits, a glossary of levels. No sorting, no selection, no pager | The reader has to find one row among many, which is a list table | `Table` |
| 2 | List table | a record | Find and act: filters, sortable columns, a pager, the first column linking to the record | The queue is given and nobody goes looking (worklist) | `Table` + `FilterBar` + `Pagination` inside `ListPageTemplate` |
| 3 | Worklist table | a record needing a decision | The set is given and every row is processed: status, one action per row, the order IS the priority | The user still has to find the rows, which is a list table | `Table` (headers stay static: `selection-rules.json` note N-worklist-holds-its-order) |
| 4 | Selection table | a candidate | Picking N rows to apply one action to: checkbox column, tri-state select-all, a batch bar with the count | Only one row is ever acted on, which is a row action | missing (`Tr selected` paints, nothing drives it) |
| 5 | Editable grid | a record being edited | Editing across records is the primary task: cell focus, type over the value, commit per cell | One record at a time, which is a form | missing (`DataGrid` cannot edit; the rules point here anyway) |
| 6 | Virtualized grid | a record among thousands | Unbounded rows, scroll rather than page, a fixed row height the windowing needs | Fewer rows than a page holds, where the machinery costs more than it saves | `DataGrid` (no sort, no selection, no keyboard) |
| 7 | Tree table | a node with columns | Hierarchy AND fields: a bill of materials, an org rollup, a file tree with size and owner | The hierarchy has no columns, which is `Tree` | missing (`treegrid` unimplemented) |
| 8 | Grouped table | a record under a heading | The rows fall into named groups the reader collapses: by owner, by status, by month | The grouping is really a filter the user changes | missing |
| 9 | Expandable-row table | a record with a second layer | Most readers need six columns, some need the twentieth field, and the page must not change | Everyone needs the detail, which means the columns are wrong | missing |
| 10 | Analytical table | a transaction under a total | Aggregation is the point: subtotals, a total row that does not scroll away, drill from sum to rows | Nothing is summed, so a footer says nothing | missing (no `TFoot`) |
| 11 | Pivot / matrix | a crossing of two axes | Two categorical axes and one measure in the cell: teams by month, region by product | One axis, which is a plain table with a sortable column | missing |
| 12 | Comparison table | an attribute | A few subjects as COLUMNS and their attributes as rows: plans, vendors, candidates, options | Many subjects, where columns run out and rows are the right axis | missing (`PlanCard` covers pricing cards, not the matrix) |
| 13 | Key-value table | one field | One record's fields read top to bottom, no comparison across records | More than one record, which is columns | `Descriptions` |
| 14 | Schedule grid | a resource across time | Time on one axis, rooms or people on the other, an event in the cell | A single date is picked, which is `Calendar` | missing |
| 15 | Heatmap table | a measured cell | The pattern across the grid matters more than any single number: density, coverage, adoption | The exact values are read, where colour becomes decoration | missing (`Td tone` is semantic, not scalar) |
| 16 | Bar-in-cell table | a ranked record | A ranking read at a glance: the number and its length in the same cell | The numbers are not comparable on one scale | composable (`Meter`, `ProgressBar`, `Sparkline` in a `Td`) |
| 17 | Log table | an event | A dense append-only stream: time first, monospace payload, filtered rather than sorted | The events are read one at a time, which is a timeline | `Table size="sm" nowrap` approximates it |
| 18 | Diff table | a change | Before and after side by side, the change marked, an audit trail with who and when | Only the current value matters | missing |
| 19 | Card table | a top row | The top N rows inside a card on an overview, no chrome, the whole card linking onward | The reader acts on the rows here, which needs a real table | composable (`Card flush` + `Table`) |
| 20 | Matrix of ticks | a feature | Binary coverage across a set: supported or not, a tick and a blank | The cell holds a value rather than a yes or no | missing (a case of 12) |

Two of these are not data tables and are listed so the decision layer can say
so: the key-value table (13) has one record and therefore no comparison, and
the reference table (1) has no interaction to owe. Everything else in the list
is a data table, and the difference between them is what a cell is allowed to
be.

**What is never a table.** A collection of prose, already ruled out by R7 of
`selection-rules.json`: a column of paragraphs aligns nothing. A layout: rows
and columns of a page are a grid, not a `table`. A set of KPI values read at a
glance: that is `Stat`, because a number in a row has to be read and a number
in a tile is seen.

## 3. Where the content goes

**The first column identifies the record, in words a human recognises.** Not a
UUID, not a database key. It carries `Td emphasis`, and if the row opens
somewhere it is the link (NN/g: the human-readable identifier first).

**Column order is importance order, and related columns are neighbours.** The
eye compares what is adjacent. Five to seven columns is where a table stays
readable; past that the extra fields belong in an expandable row, a detail
page, or a column the reader turns on.

**Alignment follows the data type, and the header follows the column.** Text
starts. Numbers that are compared end, with `tabular-nums`, so the digits line
up in a vertical rule. Dates, phone numbers, IDs and postcodes start, because
they are read as words even though they are digits. Nothing centres: centred
columns have no shared edge, and the eye loses the line. `page-audit.mjs`
already fails a centred column and a header that does not match its column.

**Units and currency live in the header, once.** "Amount (EUR)" beats a symbol
repeated down two hundred rows. The same for percent, hours, and counts.

**One value per cell.** Two facts in one cell means either a second column or a
two-line identity cell, which is the one place a cell is allowed to stack: a
name over its email, a title over its status.

**An empty cell says which kind of empty it is.** No value and zero are not the
same fact. Write "None", "Not set" or "0" and never leave the cell blank, since
a blank cell reads as a rendering failure.

**Truncate the long value, keep the row.** A cell that wraps to three lines
turns a scannable table into a wall. Under `nowrap` the value keeps one line
and the table scrolls; the full text belongs in a `Tooltip` or the record.

**Density is a decision of the screen, not of the component.** The default (md)
is for tables read and acted on. `sm` is for reference tables and logs, where
more rows on screen is worth the smaller type. Both keep every row the same
height: a row that grows because of its content breaks the scan (this system
already fixed exactly that bug on the last row of a flush card).

**Lines, not stripes, and hover to keep the place.** Rows are separated by a
1px `--border` and the pointer's row lifts to `--surface-hover`. Zebra striping
is the wide-table remedy (NN/g), and it fights every other row state (selected,
tone, hover), so it stays out until a table is wide enough to need it and has
no other state to lose.

**Status is a badge, not a coloured row.** `Td tone` fills a cell to mark a
value that is itself good or bad. It is not a status column: a status is a
`Badge` with a word in it, because colour alone is not information.

## 4. Rules of behaviour

**Sorting is a tool of finding, not of processing.** A list table sorts, and its
default sort is the answer to "what would I look at first": newest, or most
overdue. A worklist does not sort, because its reading order is its priority
order and a sortable header hands that decision back to the user. This rule is
already in the system as note N-worklist-holds-its-order, and it was caught in
review before it was written down.

**Sort state is visible and survives.** The active column shows its direction,
inactive sortable columns show that they can be sorted, and the choice is
remembered per collection with the filters, so a return visit is not a reset.

**Selection is a real checkbox.** A row that only responds to a click cannot be
selected from a keyboard and cannot say what it did. The header checkbox is
tri-state (checked, unchecked, indeterminate: `Checkbox` already supports it),
the count is stated in words, and a select-all that reaches beyond the page
says so ("All 40 on this page selected. Select all 1,284").

**Batch actions appear when a selection exists and say the count.** The bar
belongs at the top of the table, over the header, with the count and a way out
that is not deselecting one by one. A destructive batch action is confirmed and
names the number.

**How many rows to render is a threshold, not a preference.** Up to about 25
rows: all of them, no pager. Hundreds: `Pagination` at 25 or 50 a page, with the
total, because a total is orientation. No known total or no ceiling: `LoadMore`
or `DataGrid`. Infinite scroll and a page footer cannot both exist.

**The header sticks past fifteen rows.** Below that the header is still on
screen when the last row is. `stickyHeader` needs a scrolling ancestor with a
block size, which the panelled page templates provide and a bare page does not.

**A wide table scrolls sideways and never reflows.** Dropping columns to fit a
phone drops data, and this system says so in the component's own comment. What
is still missing is the anchor: when the identifying column scrolls away the
reader loses which row they are on, so the first column has to freeze. The
alternative, one card per row, is a different representation and belongs to
`AdaptiveListPage`, chosen by the rules rather than improvised at a breakpoint.

**Row actions: fewer than three are icon buttons, more go in a menu.** They live
in the last column, aligned to the end, always visible rather than revealed on
hover, since a hover-only action does not exist on a touch screen or to a
keyboard. Every icon-only control carries a `Tooltip` and an `aria-label`.

**Editing in a table is a mode, not an accident.** A cell that becomes an input
on a stray click loses data. Editing is entered deliberately (a double click, an
Edit action, an edit mode for the table), it looks different from reading, and
it commits per cell with a visible result. When the record has more than a
handful of editable fields, the answer is a side panel next to the table and
never a modal over it, because the modal hides the rows the user is copying
from (NN/g).

**The table owns its empty, loading and error states.** Empty because nothing
exists yet, empty because the filters match nothing, and loading are three
different screens: the first is an `EmptyState` with the action that would fill
it, the second says which filters to clear, the third is a skeleton of rows so
the layout does not jump. A table that renders zero rows and no message reads
as broken.

## 5. Accessibility, in the terms the ARIA pattern uses

**Table, grid, treegrid: pick one and pay for it.** A `table` is a static
structure, and its cells are not focusable. A `grid` is a composite widget: one
tab stop, arrow keys between cells, Home and End, and every interactive cell
reachable without leaving the widget. A `treegrid` adds expand and collapse on
the row. The system's `DataGrid` currently declares `role="grid"` and implements
none of it, which is the one gap here that is a defect rather than a missing
feature.

**Every table has a name.** A `caption` when the name belongs on the page, an
`aria-label` when the heading above it already says it. Neither exists in the
component today.

**`scope` on every header.** `scope="col"` on a column header and `scope="row"`
on the identifier cell, so a screen reader can say which column and which row a
value belongs to. Zero hits in the source today.

**The scroll container is a tab stop, and it is named.** `TableScroll` already
does the right thing: `role="region"`, `aria-label`, `tabIndex={0}`, so a
keyboard user can scroll it (WCAG 2.1.1). That name should say what the table
holds, not the word "table".

**Sorting announces itself.** `aria-sort` on the active column is in place. The
change of order also needs to reach a screen reader as a message, since the rows
silently rearranging is not an event a non-visual reader can see.

**Touch targets and hit areas.** The sort control already carries a 24px floor
(SC 2.5.8). Row actions and checkboxes need the same, and a row's click target
is the link in the first column, not the whole row, unless the whole row is a
link and looks like one.

## 6. What to build, in order

**P1: the rules layer and the parts every kind needs.**

1. `screen-specs/table-rules.json` plus the `check:spec` validator, exactly like
   `card-rules.json` and `form-rules.json`: a zone whose representation is
   `table` declares its `tableKind`, its row count band and whether cells
   interact, and the rules decide whether the composition it named is allowed.
   This is what turns section 2 into something the gate enforces.
2. `TableToolbar` (molecule): the search, the filters, the count and the table's
   own actions, bound to the table rather than floating above it, and the anchor
   the batch bar replaces.
3. Selection: a checkbox column convention, the tri-state header checkbox, and
   `BatchActions` (the bar with the count).
4. `TFoot` plus a total row that stays put, which is what makes kind 10 possible.
5. `caption` and default `scope` on the header cells, and an accessible name the
   component asks for rather than hopes for.
6. `DataGrid` keyboard: roving tabindex, arrow keys, Home and End, `aria-colcount`.
   Until then the honest fix is to drop `role="grid"`.

**P2: the kinds the products will ask for next.**

7. Expandable row (kind 9) and grouped rows (kind 8).
8. Editable cell in `DataGrid` (kind 5), which closes the promise R2 and H2
   already make.
9. Column control: visibility, order and a density switch, remembered per
   collection.
10. Sticky first column, so a sideways scroll keeps its anchor.
11. The three states owned by the table: empty, filtered-empty, loading.

**P3: the long tail, each waiting for a second use.**

12. Tree table (7), matrix and pivot (11), comparison table (12), schedule grid
    (14), heatmap cell (15), diff table (18).

**The proof:** a `tables` screen in the showcase, next to `content-patterns`,
rendering every kind that exists with real content, so the choice can be looked
at rather than argued about.

## Sources

SAP Fiori (responsive, grid, analytical and tree table, and the thresholds
between them), IBM Carbon (data table variants, row sizes, toolbar and batch
action bar, expansion, skeleton loading), NN/g (the four user tasks with data
tables, frozen headers and columns, editing without a modal, batch actions),
Pencil and Paper (enterprise table patterns: density, column control, inline
edit, expansion, row division), uxpatterns.dev (variants, thresholds, common
mistakes), Shopify Polaris (index table and its condensed small-screen form),
Smashing Magazine (accessible responsive table patterns, feature comparison
tables), W3C WAI-ARIA APG (table, grid and treegrid), WCAG 2.2 (1.3.1, 2.1.1,
2.5.8), and the registry and source of this package as measured above.
