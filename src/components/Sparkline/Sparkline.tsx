import "./Sparkline.css";
import { cn } from "../../lib/cn";

type Tone = "neutral" | "primary" | "success" | "warning" | "danger";
type Size = "sm" | "md" | "lg";

type Props = {
  /** The series, oldest first. Two points is the minimum that has a shape. */
  values: number[];
  /** What the trend MEANS to this metric, and it does not follow the direction: revenue climbing
   *  is `success`, a queue climbing is `warning`, and the same rising line is both.
   */
  tone?: Tone;
  /** Fills the area under the line — for a card that carries only this one series. */
  area?: boolean;
  /** How much of the row it is allowed: `sm` beside a value in a stat, larger only when the
   *  shape itself is being read.
   */
  size?: Size;
  /** What the series measures. Given, the chart is an image to a screen reader;
   *  omitted, it is decoration beside a value that already says it. */
  label?: string;
  className?: string;
};

/* The drawing space. Width is normalised to 100 so the SVG can stretch to any
 * column (preserveAspectRatio="none"); the stroke is held even by
 * vector-effect, and the endpoint dot is a real element so stretching cannot
 * turn it into an ellipse. */
const W = 100;
const H = 32;
const PAD = 2;

function geometry(values: number[]) {
  const n = values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  /* A SERIES THAT DID NOT MOVE IS DRAWN DOWN THE MIDDLE, not along the floor.
   *
   * With no span there is nothing to divide by, and the old `|| 1` put every
   * point at the bottom of the box — which reads as a value pinned at zero, the
   * one thing a flat series does not say. Found by its first test, 2026-09-03.
   * `flat` is carried rather than faked because the caller's numbers are fine;
   * it is the drawing space that has no opinion. */
  const flat = max === min;
  const span = max - min || 1;
  const step = n > 1 ? W / (n - 1) : 0;
  const points = values.map((v, i) => {
    const x = n > 1 ? i * step : W / 2;
    const y = flat ? H / 2 : PAD + (1 - (v - min) / span) * (H - PAD * 2);
    return [x, y] as const;
  });
  const line = points.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`).join(" ");
  const last = points[points.length - 1];
  return {
    line,
    area: `${line} L${W} ${H} L0 ${H} Z`,
    lastX: (last[0] / W) * 100,
    lastY: (last[1] / H) * 100,
  };
}

/** The shape of a number over time: a line with no axes, no grid and no
 *  tooltip — the trend part of a KPI card, not a chart. Reach for <Meter> when
 *  the value is judged against a target instead of against its own past. 
 *
 * Copy: the accessible label says what the trend is OF and over what, because
 * the shape alone is unreadable to anyone who cannot see it.
 */
export function Sparkline({ values, tone = "primary", area, size, label, className }: Props) {
  if (values.length < 2) return null;
  const g = geometry(values);

  return (
    <div
      className={cn("sparkline", className)}
      data-tone={tone}
      data-size={size}
      data-area={area ? "" : undefined}
      role={label ? "img" : "presentation"}
      aria-label={label}
    >
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
        {area && <path className="sparkline-area" d={g.area} />}
        <path className="sparkline-line" d={g.line} vectorEffect="non-scaling-stroke" />
      </svg>
      {/* Positioned from the END of the series, which is the inline end in both
          directions once the chart itself mirrors under [dir="rtl"]. */}
      <span
        className="sparkline-point"
        style={{ insetInlineEnd: `${100 - g.lastX}%`, insetBlockStart: `${g.lastY}%` }}
        aria-hidden="true"
      />
    </div>
  );
}
