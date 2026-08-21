import "./Table.css";
import type {
  HTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";
import { cn } from "../../lib/cn";
import { Icon } from "../Icon";

type Size = "sm" | "md";
type Align = "start" | "end" | "center";
type Tone = "success" | "warning" | "danger";
/** null = sortable but not the active sort column. */
type SortDirection = "asc" | "desc" | null;

/* Named rather than inline so the registry can read it: the generator extracts
 * the literal half of a named-Props intersection, and an inline annotation left
 * Table with an empty props entry — `verify` then rejected `stickyHeader` on a
 * table that really has it. (Wording note: spelling the declaration syntax out
 * in this comment would itself match the extractor's pattern.) */
type Props = TableHTMLAttributes<HTMLTableElement> & {
  /** Keeps the header row visible while the rows scroll. Sticky positions
   *  against the nearest scrolling ancestor, so inside `<TableScroll>` the
   *  wrapper needs a block size (a panelled page template provides one). */
  stickyHeader?: boolean
  /** Row density: md (default) / sm for dense reference tables. */
  size?: Size
  /** One record per line — the data-table variant: cells refuse to wrap
   *  mid-value (a phone number broken over two lines reads as two numbers),
   *  rows keep one height and content centres vertically. Refusing to wrap
   *  means claiming width, so pair it with `<TableScroll>`. */
  nowrap?: boolean
}

/** A styled, accessible table. Compose inside <Card flush> for an edge-to-edge
 *  surface. Sub-parts: THead, TBody, Tr, Th, Td. */
export function Table({ stickyHeader, size, nowrap, className, ...rest }: Props) {
  return <table className={cn("table", className)} data-sticky={stickyHeader || undefined} data-size={size} data-nowrap={nowrap || undefined} {...rest} />;
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

export function TBody(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...props} />;
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
  align, sortable, sortDirection, onSort, className, children, ...rest
}: Omit<ThHTMLAttributes<HTMLTableCellElement>, "align"> & {
  align?: Align;
  /** Renders the header as a sort control. */
  sortable?: boolean;
  /** Current sort on THIS column: 'asc' / 'desc' / null (sortable but inactive). */
  sortDirection?: SortDirection;
  /** Called when the header is activated to change the sort. */
  onSort?: () => void;
}) {
  if (!sortable) {
    return <th className={cn("table-th", className)} data-align={align} {...rest}>{children}</th>;
  }
  const ariaSort = sortDirection === "asc" ? "ascending" : sortDirection === "desc" ? "descending" : "none";
  /* Inactive columns show the down arrow at low opacity (a "click to sort" hint,
   * styled in CSS); the active column shows the real direction. */
  const sortIcon = sortDirection === "asc" ? "arrow_upward" : "arrow_downward";
  return (
    <th className={cn("table-th", className)} data-align={align} aria-sort={ariaSort} {...rest}>
      <button type="button" className="table-sort" data-active={sortDirection ? true : undefined} onClick={onSort}>
        {children}
        <Icon name={sortIcon} className="table-sort-icon" />
      </button>
    </th>
  );
}

export function Td({ align, emphasis, tone, className, ...rest }: Omit<TdHTMLAttributes<HTMLTableCellElement>, "align"> & { align?: Align; emphasis?: boolean; tone?: Tone }) {
  return <td className={cn("table-td", className)} data-align={align} data-emphasis={emphasis || undefined} data-tone={tone} {...rest} />;
}
