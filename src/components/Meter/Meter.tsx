import "./Meter.css";
import { cn } from "../../lib/cn";

type Tone = "primary" | "success" | "warning" | "danger";
type Size = "sm" | "md";

/* Monolithic because a meter is a value against a scale: the value, the
 * scale, the target on it, and how much of that scale is drawn. Its parts
 * are marks, not components. */
type Props = {
  value: number;
  /** Scale maximum (default 100). */
  max?: number;
  /** Optional goal marker rendered on the track. */
  target?: number;
  /** What the reading MEANS, and it does not come from the fill: 1.4 of 3 short of target is
   *  `warning`; the same 1.4 against a target of 1 is `success`. Colour picked from the
   *  percentage congratulates you for missing.
   */
  tone?: Tone;
  /** Density, not importance: `md` when the meter is the point of its block, `sm` in a row of
   *  many where the reader scans for the odd one out.
   */
  size?: Size;
  /** Tick labels under the track: an explicit list, or `true` for [0, max]. */
  ticks?: number[] | boolean;
  /** Accessible description of what the meter measures. */
  label?: string;
  className?: string;
};

const clamp = (n: number) => Math.max(0, Math.min(100, n));

/** A linear progress / gauge on a fixed scale, with an optional target marker.
 *  The fill width and marker position are the only dynamic inline styles. 
 *
 * Copy: the label carries the sentence, because a gauge with a number and no
 * subject is a decoration: "Storage used, 62 of 100 GB".
 */
export function Meter({ value, max = 100, target, tone = "primary", size, ticks, label, className }: Props) {
  const pct = clamp((value / max) * 100);
  const targetPct = target != null ? clamp((target / max) * 100) : null;
  const tickVals = Array.isArray(ticks) ? ticks : ticks ? [0, max] : null;

  return (
    <div
      className={cn("meter", className)}
      data-tone={tone}
      data-size={size}
      role="meter"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
    >
      <div className="meter-track">
        <div className="meter-fill" style={{ inlineSize: `${pct}%` }} />
        {targetPct != null && (
          <div className="meter-target" style={{ insetInlineStart: `${targetPct}%` }} aria-hidden="true" />
        )}
      </div>
      {tickVals && (
        <div className="meter-ticks">
          {tickVals.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}
