import "./DateBlock.css";
import { cn } from "../../lib/cn";

type Tone = "neutral" | "primary" | "success" | "warning" | "danger";
type Size = "sm" | "md";

type Props = {
  /** ISO string, epoch milliseconds, or a Date. */
  value: string | number | Date;
  /** BCP-47 tag. Omit to follow the browser. */
  locale?: string;
  /** Fills the block as a coloured tile. Omitted, the date is type in ink,
   *  which is what a card wants; a tone is for a calendar strip. */
  tone?: Tone;
  /** How the row is used: `md` when the date leads a list being scanned, `sm` inside a denser
   *  row where the title leads.
   */
  size?: Size;
  className?: string;
};

/** A date as a block the eye lands on first: the month small over the day
 *  large. For an EVENT, where the reader scans by date — a timestamp inside a
 *  sentence is <Time>, and a field in a record is a plain value. */
export function DateBlock({ value, locale, tone, size, className }: Props) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const month = new Intl.DateTimeFormat(locale, { month: "short" }).format(date);
  const day = new Intl.DateTimeFormat(locale, { day: "numeric" }).format(date);
  /* The machine-readable instant travels with the human one, the same promise
   * <Time> makes: the tile is a rendering of a date, not a picture of one. */
  return (
    <time
      className={cn("date-block", className)}
      data-tone={tone}
      data-size={size}
      dateTime={date.toISOString()}
      title={new Intl.DateTimeFormat(locale, { dateStyle: "full" }).format(date)}
    >
      <span className="date-block-month">{month}</span>
      <span className="date-block-day">{day}</span>
    </time>
  );
}
