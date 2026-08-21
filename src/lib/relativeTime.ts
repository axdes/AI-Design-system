/* Dates, said the way a person reading a chat would say them.
 *
 * Promoted out of one app when a second needed the same five helpers: a chat
 * tool says "12 min ago" and groups a thread by day, and two products doing it from copies is the
 * thing the promotion rule exists to stop. */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * "just now" / "12 min ago" / "3 h ago" / "yesterday" / a date.
 *
 * `now` is a parameter rather than read inside, so the tests are not about what time it is.
 */
export function ago(iso: string | null | undefined, now: number = Date.now()): string {
  if (!iso) return "never";
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "never";
  const diff = now - then;
  if (diff < 0) return "just now";
  if (diff < MINUTE) return "just now";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)} min ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)} h ago`;
  if (diff < 2 * DAY) return "yesterday";
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)} days ago`;
  return new Date(then).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

/** The clock time on a message, which is what a thread is read by. */
export function timeOfDay(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

/** The day a message belongs to, for the separators between days in a thread. */
export function dayLabel(iso: string, now: number = Date.now()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const startOf = (t: number) => new Date(new Date(t).setHours(0, 0, 0, 0)).getTime();
  const days = Math.round((startOf(now) - startOf(d.getTime())) / DAY);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

/** "1 message" / "14 messages", because "14 message(s)" is not English. */
export function plural(n: number, one: string, many: string = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

/**
 * A thread split into days, in the order it arrived.
 *
 * Anyone catching up reads a chat as "what happened yesterday", not "the last 43 messages", so the
 * day is the unit the screen is grouped by. Consecutive runs only: the input is already ordered,
 * and grouping by key instead would silently reorder a thread whose clocks disagree.
 *
 * @public Nothing in this package calls it: a consuming app does, through `@lib/relativeTime`.
 * Without the tag the dead-export rule is right about what it can see and wrong about the
 * repository, which is why it reads the consuming apps when they are on disk.
 */
export function byDay<T extends { at: string }>(items: T[], now: number = Date.now()): { day: string; items: T[] }[] {
  const out: { day: string; items: T[] }[] = [];
  for (const item of items) {
    const day = dayLabel(item.at, now);
    const last = out[out.length - 1];
    if (last?.day === day) last.items.push(item);
    else out.push({ day, items: [item] });
  }
  return out;
}

/**
 * The same idea as `ago`, said in the reader's language.
 *
 * Both live here on purpose rather than one calling the other. `ago` returns
 * fixed English strings ("12 min ago", "yesterday") that two chat products and
 * their tests depend on word for word; this one hands the wording to
 * `Intl.RelativeTimeFormat`, which is what a component shipped in en AND ar has
 * to do. Changing `ago` to match would rewrite copy in two shipped products.
 *
 * `now` is a parameter for the same reason it is one above: so a test is not
 * about what time it is.
 */
export function relativeLabel(ts: number, now: number, locale?: string): string {
  const diff = ts - now;
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const WEEK = 7 * DAY;
  const MONTH = 30 * DAY;
  const YEAR = 365 * DAY;
  if (abs < MINUTE) return rtf.format(Math.round(diff / 1000), "second");
  if (abs < HOUR) return rtf.format(Math.round(diff / MINUTE), "minute");
  if (abs < DAY) return rtf.format(Math.round(diff / HOUR), "hour");
  if (abs < WEEK) return rtf.format(Math.round(diff / DAY), "day");
  if (abs < MONTH) return rtf.format(Math.round(diff / WEEK), "week");
  if (abs < YEAR) return rtf.format(Math.round(diff / MONTH), "month");
  return rtf.format(Math.round(diff / YEAR), "year");
}
