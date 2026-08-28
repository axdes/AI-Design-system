import "./Table.css";
import type {
  HTMLAttributes,
  ReactNode,
  Ref,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";
import { cn } from "../../lib/cn";
import { Icon } from "../Icon";
import { Skeleton } from "../Skeleton";

type Size = "sm" | "md";
/** How the columns are sized. `auto` (the default) lets the content decide, so
 *  the table re-flows as the data changes. `fixed` honours the widths the
 *  header declares and is what makes a truncation possible at all: with `auto`
 *  the column simply widens to fit the longest value. */
type Layout = "auto" | "fixed";
/** Below which breakpoint a column is dropped. A column may only be dropped
 *  when its value is reachable another way (an expandable row, the record). */
type HideBelow = "sm" | "md";
type Align = "start" | "end" | "center";
type Tone = "success" | "warning" | "danger";
/** The heatmap ramp: 0 coldest, 4 hottest. Five discrete steps, because that
 *  is what an eye separates without a legend in every cell. */
type Heat = 0 | 1 | 2 | 3 | 4;
/** null = sortable but not the active sort column. */
type SortDirection = "asc" | "desc" | null;

/* Named rather than inline so the registry can read it: the generator extracts
 * the literal half of a named-Props intersection, and an inline annotation left
 * Table with an empty props entry — `verify` then rejected `stickyHeader` on a
 * table that really has it. (Wording note: spelling the declaration syntax out
 * in this comment would itself match the extractor's pattern.) */
type Props = TableHTMLAttributes<HTMLTableElement> & {
  /** Header stays while the rows scroll. It sticks to the nearest scrolling
   *  ancestor, so inside `<TableScroll>` give the wrapper a block size. */
  stickyHeader?: boolean
  /** Keeps `<TFoot>` on the bottom edge: a total that scrolls away is a total
   *  nobody reads. */
  stickyFooter?: boolean
  /** Freezes the first column: when the identifier scrolls out of view the
   *  reader is on an unnamed row. */
  stickyColumn?: boolean
  /** Row density: md (default) / sm for dense reference tables. */
  size?: Size
  /** One record per line: values never wrap mid-value (a phone number broken
   *  in half reads as two numbers) and rows keep one height. It claims width,
   *  so pair it with `<TableScroll>`. */
  nowrap?: boolean
  /** The table's name, as a real `<caption>`. Give it this or an `aria-label`:
   *  a table with neither is unnamed to anyone who cannot see the heading. */
  caption?: ReactNode
  /** Keeps the caption for assistive technology only, when the heading above
   *  already says the same words. */
  captionHidden?: boolean
  /** Column sizing: content-driven (default) or the widths the header declares. */
  layout?: Layout
}

/** A styled, accessible table. Compose inside <Card flush> for an edge-to-edge
 *  surface. Sub-parts: THead, TBody, TFoot, Tr, Th, Td, TrGroup, TrDetail,
 *  TableEmpty, TableSkeleton. 
 *
 * Copy: the caption names what the table lists, even when hidden — it is the
 * table's only name for a screen reader.
 */
export function Table({
  stickyHeader, stickyFooter, stickyColumn, size, nowrap, caption, captionHidden, layout, className, children, ...rest
}: Props) {
  return (
    <table
      className={cn("table", className)}
      data-sticky={stickyHeader || undefined}
      data-sticky-foot={stickyFooter || undefined}
      data-sticky-col={stickyColumn || undefined}
      data-size={size}
      data-nowrap={nowrap || undefined}
      data-layout={layout}
      {...rest}
    >
      {caption ? <caption className="table-caption" data-hidden={captionHidden || undefined}>{caption}</caption> : null}
      {children}
    </table>
  );
}

/** Horizontal scroll container for a table whose columns will not fit. A table
 *  must not reflow (dropping columns drops data), so the row scrolls sideways
 *  and the page does not. `label` names the keyboard tab stop that creates.
 *
 *  Sticky headers stick to the nearest scrolling ancestor, so inside this
 *  wrapper `stickyHeader` needs a block size on the wrapper (via className). */
export function TableScroll({ label, className, ...rest }: HTMLAttributes<HTMLDivElement> & { label: string }) {
  return <div className={cn("table-scroll", className)} role="region" aria-label={label} tabIndex={0} {...rest} />;
}

export function THead(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className="table-head" {...props} />;
}

/** `ref` is forwarded so a composition can own the keyboard for the whole body
 *  (a treegrid walks its rows from one handler). */
export function TBody({ ref, ...rest }: HTMLAttributes<HTMLTableSectionElement> & { ref?: Ref<HTMLTableSectionElement> }) {
  return <tbody ref={ref} {...rest} />;
}

/** Totals and subtotals, in a real `<tfoot>`: not one more record to a screen
 *  reader, and pinned by `<Table stickyFooter>`. */
export function TFoot(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <tfoot className="table-foot" {...props} />;
}

/** `selected` marks a row picked in a selectable table (checkbox column). */
export function Tr({ selected, className, ...rest }: HTMLAttributes<HTMLTableRowElement> & { selected?: boolean }) {
  return <tr className={cn("table-row", className)} data-selected={selected || undefined} aria-selected={selected || undefined} {...rest} />;
}

/* `align` is omitted from the HTML attributes on purpose: the deprecated DOM
 * attribute types it as "left" | "center" | "right" | …, and intersecting that
 * with our logical Align left only "center" assignable, so align="end" did not
 * typecheck even though the CSS styles it. */
export function Th({
  align, sortable, sortDirection, onSort, select, emphasis, width, hideBelow, scope = "col", className, children, style, ...rest
}: Omit<ThHTMLAttributes<HTMLTableCellElement>, "align"> & {
  align?: Align;
  /** Renders the header as a sort control. */
  sortable?: boolean;
  /** Current sort on THIS column: 'asc' / 'desc' / null (sortable but inactive). */
  sortDirection?: SortDirection;
  /** Called when the header is activated to change the sort. */
  onSort?: () => void;
  /** The checkbox column: sized to its control instead of sharing the width. */
  select?: boolean;
  /** A row header's identifier: the record's name, in the body's ink. */
  emphasis?: boolean;
  /** The column's width, declared once on its header. Any CSS length, honoured
   *  under `<Table layout="fixed">`. Fix the predictable columns (status, date,
   *  actions) and let the text ones take what is left. */
  width?: string;
  /** Drops this column below a breakpoint. Only for a column whose value is
   *  reachable another way: dropping a column drops data, and the identifier
   *  and the actions are never the ones to go. */
  hideBelow?: HideBelow;
}) {
  /* `scope` defaults to the column, which is what a header in <THead> is. A row
   * header (the identifier cell of a record) passes scope="row" and is the only
   * way a non-visual reader hears which row a value belongs to. */
  if (!sortable) {
    return (
      <th
        className={cn("table-th", className)}
        data-align={align}
        data-select={select || undefined}
        data-emphasis={emphasis || undefined}
        data-hide-below={hideBelow}
        scope={scope}
        /* A width is a measurement the caller supplies, which is the one thing
         * an inline style is for. */
        style={width ? { ...style, inlineSize: width } : style}
        {...rest}
      >
        {children}
      </th>
    );
  }
  const ariaSort = sortDirection === "asc" ? "ascending" : sortDirection === "desc" ? "descending" : "none";
  /* Inactive columns show the down arrow at low opacity (a "click to sort" hint,
   * styled in CSS); the active column shows the real direction. */
  const sortIcon = sortDirection === "asc" ? "arrow_upward" : "arrow_downward";
  return (
    <th
      className={cn("table-th", className)}
      data-align={align}
      data-hide-below={hideBelow}
      scope={scope}
      aria-sort={ariaSort}
      style={width ? { ...style, inlineSize: width } : style}
      {...rest}
    >
      <button type="button" className="table-sort" data-active={sortDirection ? true : undefined} onClick={onSort}>
        {children}
        <Icon name={sortIcon} className="table-sort-icon" />
      </button>
    </th>
  );
}

export function Td({ align, emphasis, tone, heat, select, hideBelow, className, ...rest }: Omit<TdHTMLAttributes<HTMLTableCellElement>, "align"> & {
  align?: Align;
  emphasis?: boolean;
  tone?: Tone;
  /** Paints the cell on the heatmap ramp (0 to 4), for a table read as a
   *  pattern. `tone` is the semantic fill and says good or bad. */
  heat?: Heat;
  /** The checkbox column: sized to its control instead of sharing the width. */
  select?: boolean;
  /** Drops this cell below a breakpoint. It has to match its header's
   *  `hideBelow`, or the row and the head stop having the same columns. */
  hideBelow?: HideBelow;
}) {
  return (
    <td
      className={cn("table-td", className)}
      data-align={align}
      data-emphasis={emphasis || undefined}
      data-tone={tone}
      data-heat={heat}
      data-select={select || undefined}
      data-hide-below={hideBelow}
      {...rest}
    />
  );
}

/** The heading over a group of COLUMNS: "Q1" over three months, a plan over its
 *  price and its seats. It sits in its own row above the column headers, spans
 *  the columns it names, and is scoped to them so a screen reader can say which
 *  group a value belongs to. A group that exists to tidy the header is
 *  decoration, and decoration in a header costs a row on every screen. */
export function ThGroup({ colSpan, align = "center", className, children, ...rest }: Omit<ThHTMLAttributes<HTMLTableCellElement>, "align"> & {
  colSpan: number;
  align?: Align;
}) {
  return (
    <th className={cn("table-th", "table-colgroup", className)} scope="colgroup" colSpan={colSpan} data-align={align} {...rest}>
      {children}
    </th>
  );
}

/** The heading over a group of rows: its name, its count and the control that
 *  collapses it. A set the READER changes is a filter, not a group. */
export function TrGroup({ label, count, expanded, onToggle, colSpan, className, ...rest }: Omit<HTMLAttributes<HTMLTableRowElement>, "onToggle"> & {
  label: ReactNode;
  /** How many rows are inside, so a collapsed group says what it hides. */
  count?: number;
  expanded: boolean;
  onToggle: () => void;
  /** How many columns the table has, so the heading spans all of them. */
  colSpan: number;
}) {
  return (
    <tr className={cn("table-group", className)} {...rest}>
      {/* colgroup scope: the cell heads every column of the rows under it. The
        * whole heading is the control, so it is not an icon-only target and it
        * reads its own name out. */}
      <th className="table-group-cell" scope="colgroup" colSpan={colSpan}>
        <button type="button" className="table-group-toggle" aria-expanded={expanded} onClick={onToggle}>
          <Icon name="chevron_right" className="table-chevron" />
          <span className="table-group-label">{label}</span>
          {count === undefined ? null : <span className="table-group-count">{count}</span>}
        </button>
      </th>
    </tr>
  );
}

/** The disclosure cell of an expandable row. `label` names WHICH row it
 *  opens: twenty rows of "Expand" name nothing. */
export function TdExpand({ expanded, onToggle, label, className, ...rest }: Omit<TdHTMLAttributes<HTMLTableCellElement>, "onToggle"> & {
  expanded: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <td className={cn("table-td", "table-expand-cell", className)} {...rest}>
      <button type="button" className="table-expand" aria-expanded={expanded} aria-label={label} onClick={onToggle}>
        <Icon name="chevron_right" className="table-chevron" />
      </button>
    </td>
  );
}

/** A row's second layer, in place: render it after its own row, while that row
 *  is expanded, spanning every column. */
export function TrDetail({ colSpan, className, children, ...rest }: HTMLAttributes<HTMLTableRowElement> & { colSpan: number }) {
  return (
    <tr className={cn("table-detail", className)} {...rest}>
      <td className="table-detail-cell" colSpan={colSpan}>{children}</td>
    </tr>
  );
}

/** What the table shows instead of rows. Nothing-yet and nothing-matches are
 *  two different screens: pass the `<EmptyState>` that fits. */
export function TableEmpty({ colSpan, className, children, ...rest }: HTMLAttributes<HTMLTableRowElement> & { colSpan: number }) {
  return (
    <tr className={cn("table-empty", className)} {...rest}>
      <td className="table-empty-cell" colSpan={colSpan}>{children}</td>
    </tr>
  );
}

/** The rows before they arrive, so the layout does not jump. Announce loading
 *  once on the region (aria-busy), not on every shimmer. */
export function TableSkeleton({ columns, rows = 5 }: { columns: number; rows?: number }) {
  return (
    <TBody aria-hidden="true">
      {Array.from({ length: rows }, (_, r) => (
        <Tr key={r}>
          {Array.from({ length: columns }, (_, c) => (
            <Td key={c}><Skeleton shape="text" /></Td>
          ))}
        </Tr>
      ))}
    </TBody>
  );
}
