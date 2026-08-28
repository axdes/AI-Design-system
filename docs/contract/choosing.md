# The pairs that get confused, where the wrong pick still compiles

*Reference for `AGENTS.md`. The contract stays short enough to read
in full on every task; this is what it points at when a task needs it.*

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
  the count is unbounded or cells are edited. Hierarchy with columns is
  `TreeTable`, two axes with a measure in the cell is `PivotTable`, a few
  subjects as COLUMNS is `ComparisonTable`, a resource against time is
  `ScheduleGrid`, before-and-after is `DiffTable`, and one record's fields is
  `Descriptions`. Above the table: `TableToolbar`, and `BatchActions` in its
  place while rows are selected.
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
