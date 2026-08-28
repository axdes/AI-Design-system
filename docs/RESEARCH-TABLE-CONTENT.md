# Inside the table: what a cell may be, and how a column is organised

Measured against the registry and the source on 2026-08-23, the same day the
table LAYER landed (`docs/RESEARCH-TABLES.md`). That survey answered which KIND
of table a zone gets. This one answers the question under it, and the one the
owner asked next: the exhibits are mostly text, and a real table is not. What
happens when a column holds a person, a status, a measurement, a picture, an
action, or two facts at once; what happens when there are twenty columns; and
when two columns belong under one heading.

Nothing here is built yet. This is the measurement and the proposal.

## 1. What the system can already put in a cell

Every one of these is in the registry today and needs no new component to be
used inside a `<Td>`:

| What the cell carries | The part that carries it |
| --- | --- |
| A person: face, name, secondary line | `Identity` (and `Avatar`, `AvatarGroup` for several) |
| A status word | `Badge` (soft fill, one word) |
| Labels, several per cell | `Tag` (read-only) / `Chip` (selectable) |
| A record that lives elsewhere | `EntityLink`, `Link` |
| A time, said the way a reader says it | `Time` (relative, exact underneath), `DateBlock` |
| A measurement on a scale | `Meter` (with a target), `ProgressBar` |
| A trend | `Sparkline` |
| A score | `Rating` |
| A matched substring in a search result | `Highlight` |
| One piece of secondary information | `MetaItem` (icon + value) |
| A value worth copying | `CopyButton` |
| An action, or several | `Button size="sm"`, `IconButton` + `Tooltip`, `Dropdown` |
| A choice | `Checkbox`, `Switch`, `Select` |
| An editable value | `Input` in a `DataGrid` editable column |
| A measured colour | `Td heat` (0 to 4) |
| A good or bad value | `Td tone` (success / warning / danger) |
| Numbers that line up | `Td align="end"` (tabular figures come with it) |

So the parts exist. What does not exist is the CONTRACT: which part belongs in
which column, what a column may not do, and what happens when the content is
longer than the column.

## 2. What is missing, measured

- **No cell-content contract at all.** `Td` takes `children`. Nothing says a
  status column holds one `Badge` and not three, that an action column is the
  last one, or that a column of prose is a column the table should not have.
  `table-rules.json` decides the KIND of table and stops at the row.
- **No truncation anywhere in the table.** Zero hits for `text-overflow` in
  `Table.css` (it is in `DataGrid.css`, `Identity.css` and eight others). A long
  value either wraps to three lines and breaks the scan, or, under `nowrap`,
  widens the table until the row scrolls. There is no third answer, and the
  third answer is the one every survey names: one line, an ellipsis, and the
  whole value in a `Tooltip`.
- **No column groups.** `Th` accepts `colSpan` (it is HTML), and `TrGroup` uses
  `scope="colgroup"` for a ROW heading, but there is no two-row header where
  "Q1" spans three months, and no rule for when that is allowed.
- **No column widths.** `DataGrid` columns take a `width`; `Table` has none, so
  every column is sized by its content and a table re-flows as the data
  changes. There is no minimum, no fixed-width column, no "this one takes the
  rest".
- **No number formatting.** `align="end"` gives tabular figures and nothing
  else: the currency, the unit and the decimal places are the caller's problem
  in every product, which is how the same amount ends up written three ways.
- **No convention for the two-line cell.** `Identity` does it for a person;
  everything else that needs a value over its secondary line (an invoice over
  its supplier, a title over its path) is hand-stacked.
- **No column priority.** Nothing says which columns survive a narrow viewport,
  so the answer is always the horizontal scroll.

## 3. The taxonomy: eighteen kinds of cell

A cell is picked by what the value IS, not by what it looks like. The column
holds one kind for every row: a column that is a badge on some rows and a
sentence on others is two columns.

| # | Cell | Holds | Rules it owes | This system |
| --- | --- | --- | --- | --- |
| 1 | Identifier | the record's own name or number | First column, row header (`scope="row"`), emphasis, links to the record | `Th scope="row" emphasis` |
| 2 | Identity | a person or a team | Face beside the name, never above it; the secondary line is the address or the role | `Identity` |
| 3 | Text | a short value: a supplier, a place | Starts. One line, truncated with the whole value in a tooltip | `Td` (truncation missing) |
| 4 | Secondary text | a value under a value | Two lines maximum, the second at `--font-xs` in `--muted-foreground` | missing as a convention |
| 5 | Number | a count, a quantity | Ends, tabular figures, the unit in the header | `Td align="end"` |
| 6 | Money | an amount with a currency | Ends, tabular figures, currency in the header when the column is one currency and in the cell when it is not (Fiori puts the amount and the code in one cell) | `Td align="end"` + the caller's formatter |
| 7 | Percent or ratio | a share | Ends, one decimal at most, and a bar if the column is compared rather than read | `Td align="end"` + `Meter` |
| 8 | Date | when something happens | Starts (it is read as a word), one format per table, absolute in a data table | `Time`, `DateBlock` |
| 9 | Relative time | when something happened | "2 hours ago" with the exact time underneath, for streams and activity | `Time` |
| 10 | Status | which state a record is in | One word in a `Badge`, one tone per state, never colour alone, never a coloured row | `Badge` |
| 11 | Tags | several labels at once | Two visible plus "+N", never a wall of pills; the full set in the record | `Tag` + a "+N" (the overflow is missing) |
| 12 | Boolean | supported or not | A tick and a blank, each carrying its words | `ComparisonTable`'s mark |
| 13 | Measure | a value on a scale, compared down the column | The bar and the number in one cell, one scale named in the header | `Meter`, `ProgressBar` |
| 14 | Trend | a shape over time | No axes, no tooltip: the direction is the message | `Sparkline` |
| 15 | Media | a thumbnail that identifies the row | Fixed size, square or 16/9, never the row's height driver | `Avatar` (a thumbnail cell is missing) |
| 16 | Link | a record that lives elsewhere | The link is the value, not a "view" verb in a column of its own | `Link`, `EntityLink` |
| 17 | Actions | what can be done to this row | Last column, aligned to the end, under three are icon buttons with tooltips, more go in a menu, always visible | `IconButton` + `Tooltip`, `Dropdown` |
| 18 | Empty | no value | Says which kind of empty: "None", "Not set", or "0". Never a blank cell, never a dash | missing as a convention |

## 4. How a column is organised

**One kind per column, and the header names the kind.** "Amount (EUR)" is a
money column; "Owner" is an identity column. A column whose header is a noun and
whose cells are sentences is not a column.

**Five to seven columns is where a table stays readable.** Past that: an
expandable row for the long tail (kind 9 of the table layer), a detail page, or
a column the reader turns on (`ColumnPicker`, built).

**Width is a decision, not an accident.** Fixed for the predictable columns
(status, date, actions), flexible for the text ones, a minimum on every flexible
column so it cannot collapse. This is the hybrid every source lands on, and the
one thing `Table` cannot express today.

**One line per row, with one exception.** The exception is the identity cell: a
name over an email, a title over a path. Two lines, never three, and only in one
column. Everything else truncates.

**Column groups exist for one reason: two axes in one header.** Three months
under "Q1", a plan's price and its seats under the plan. The heading spans its
columns with `scope="colgroup"`, and the group has a name a reader would say
out loud. A group that exists to make the header look tidy is decoration, and
decoration in a header costs a row of vertical space on every screen.

**Twenty columns is a different table, not a wider one.** In order: turn columns
off, freeze the identifier (`Table stickyColumn`, built), and only then scroll
sideways. A pivot or a matrix is often what a twenty-column table actually is.

## 5. What to build, in order

**P1: the parts a real cell needs.**

1. `Truncate` (atom): one line, an ellipsis, the whole value in a `Tooltip`, and
   nothing when the value fits. Four characters minimum before the ellipsis
   (PatternFly), never on a column header.
2. `Td` gains `width` and `min`, or `Table` gains a `columns` contract. The
   first is smaller; the second is what makes a column's kind declarable.
3. A number formatter in `@lib`: money, percent, count, with the unit going to
   the header. One writing of an amount per system.
4. The two-line cell as a part (`CellStack`? the name is open): value over
   secondary, the second line at `--font-xs`, so it stops being hand-stacked.
5. The tag overflow: two tags plus "+N" with the rest in a tooltip.

**P2: the column layer.**

6. `ColGroup` support on `THead`: a second header row, `scope="colgroup"`, and a
   rule in `table-rules.json` for when a group is allowed.
7. Column priority for narrow viewports, so `AdaptiveListPage` and the scroll
   are a choice rather than a default.
8. A thumbnail cell (fixed box, never the row's height driver).

**P3: the contract.**

9. `cell-rules.json`, the layer under `table-rules.json`: a column declares what
   it CARRIES (identifier, identity, status, money, measure, action, …) and the
   rules decide its alignment, its width behaviour, whether it may sort, and
   what it owes. That is what would make a column reviewable the way a card
   family is, and it is the piece that turns section 3 from prose into a gate.

## Sources

Handsontable's data-table anatomy (cell variants: data, column header, row
header, corner; states; multi-level headers), setproduct's 2026 data-table guide
(cell content patterns, alignment, the fixed-plus-flexible width hybrid, three
densities), PatternFly (truncation: four characters, where the ellipsis goes,
never a header, tooltip under 150 characters), Carbon (row heights, the toolbar,
expansion), SAP Fiori (smart table columns, micro charts in a cell, amount and
currency in one cell), NN/g (the four user tasks), Pencil and Paper (enterprise
cell patterns), Stéphanie Walter's survey of complex-table resources, and the
registry and source of this package as measured above.
