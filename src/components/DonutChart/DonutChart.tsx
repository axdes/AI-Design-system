import "./DonutChart.css";
import { type ReactNode, useState } from "react";
import { cn } from "../../lib/cn";
import { formatValue } from "../../lib/chart";

type Tone = "neutral" | "primary" | "success" | "warning" | "danger";
type Size = "sm" | "md" | "lg";

export type Segment = {
  /** What this share IS — it appears in the legend and in the accessible name. */
  label: string;
  value: number;
  /** The status this share carries, when the ring answers "how much of it is
   *  bad". Omit it and the segment takes its slot colour instead, which is what
   *  a ring of unrelated things (sites, categories) wants. Do not mix the two
   *  in one ring: a slot colour beside a status colour reads as a status. */
  tone?: Tone;
};

type Props = {
  segments: Segment[];
  /** What sits in the hole: the total, or the share that matters. Under the
   *  pointer the hole shows the segment being read instead. */
  center?: ReactNode;
  /** A word under it — "open", "of 320". */
  caption?: ReactNode;
  size?: Size;
  /** Off when the segments are already named beside the chart. */
  legend?: boolean;
  /** Shares as percentages beside the values. */
  percent?: boolean;
  /** What the whole ring measures. */
  label?: string;
  /** BCP-47 tag for the numbers. Omit to follow the browser. */
  locale?: string;
  className?: string;
};

const R = 16;
const C = 2 * Math.PI * R;
/* The gap between two arcs, in the same units as the circumference: a 2-unit
 * hole in the ring, so two segments never melt into one shape. Same 2px surface
 * gap the stacked bars use. */
const GAP = 1.2;

/** A whole split into named shares: how much of the total is open, at risk,
 *  done. Hovering a share reads it in the hole. Reach for <Progress shape="ring"> when
 *  there is ONE value on a scale — a ring with a single segment is that
 *  component wearing a legend. 
 *
 * Copy: the caption says what the whole ring adds up to, because a share is
 * meaningless without its total. Segment labels are the categories' own
 * names, not abbreviations.
 */
export function DonutChart({ segments, center, caption, size, legend = true, percent, label, locale, className }: Props) {
  const [at, setAt] = useState<number | null>(null);
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (!total) return null;

  const format = (v: number) => formatValue(v, locale);
  const share = (v: number) => `${Math.round((v / total) * 100)}%`;

  /* Each arc starts where the ones before it ended, so the offset is a running
   * sum rather than a variable reassigned while rendering. The gap is taken off
   * the arc itself, never off the offset, or the shares stop adding up. */
  const arcs = segments.map((s, i) => ({
    ...s,
    dash: Math.max(0, (s.value / total) * C - GAP),
    offset: (segments.slice(0, i).reduce((sum, prev) => sum + prev.value, 0) / total) * C,
  }));

  /* The values a sighted reader gets from the legend, said once for everyone
   * else. Built outside the JSX: a template inside a template is unreadable. */
  const summary = segments.map((s) => `${s.label} ${format(s.value)}`).join(", ");
  const read = at != null ? segments[at] : null;

  return (
    <div className={cn("donut-chart", className)} data-size={size} onMouseLeave={() => setAt(null)}>
      <div
        className="donut-chart-ring"
        role={label ? "img" : "presentation"}
        aria-label={label ? `${label}: ${summary}` : undefined}
      >
        <svg viewBox="0 0 40 40" aria-hidden="true" focusable="false">
          <circle className="donut-chart-track" cx="20" cy="20" r={R} />
          {arcs.map((a, i) => (
            <circle
              key={a.label}
              className="donut-chart-arc"
              data-tone={a.tone}
              data-series={a.tone ? undefined : (i % 6) + 1}
              data-active={at === i ? "" : undefined}
              cx="20"
              cy="20"
              r={R}
              strokeDasharray={`${a.dash} ${C - a.dash}`}
              strokeDashoffset={-a.offset}
            />
          ))}
        </svg>
        <div className="donut-chart-center">
          {/* Under the pointer the hole answers about the share being read, and
              goes back to the total when the pointer leaves. */}
          <span className="donut-chart-value">{read ? format(read.value) : center}</span>
          <span className="donut-chart-caption">{read ? read.label : caption}</span>
        </div>
      </div>
      {legend && (
        <ul className="donut-chart-legend">
          {segments.map((s, i) => (
            <li key={s.label} data-active={at === i ? "" : undefined} onMouseEnter={() => setAt(i)}>
              <span
                className="donut-chart-dot"
                data-tone={s.tone}
                data-series={s.tone ? undefined : (i % 6) + 1}
                aria-hidden="true"
              />
              {s.label}
              <span className="donut-chart-legend-value">
                {format(s.value)}
                {percent && <span className="donut-chart-share">{share(s.value)}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
