import "./Stat.css";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";
import { Icon, type IconName } from "../Icon";

type Tone = "neutral" | "primary" | "success" | "warning" | "ai";
type Size = "md" | "lg";
type DeltaDirection = "up" | "down" | "flat";
type DeltaTone = "success" | "danger" | "neutral";

type Props = HTMLAttributes<HTMLDivElement> & {
  /** The headline metric (rendered tabular-nums). */
  value: ReactNode;
  /** Caption under the value. */
  label: ReactNode;
  /** Semantic emphasis for the value. */
  tone?: Tone;
  /** Small suffix after the value, e.g. "/3" or "%". */
  unit?: string;
  /** The comparison that makes the value mean something: "+12% vs last week". */
  delta?: ReactNode;
  /** Which way it moved. Separate from `deltaTone` on purpose — up is good for
   *  revenue and bad for latency, so the arrow and the colour answer different
   *  questions. Named for the delta it describes, because `direction` alone was
   *  three different questions across the system (2026-08-26). */
  deltaDirection?: DeltaDirection;
  /** Whether that move is good news. Defaults to neutral, which colours nothing. */
  deltaTone?: DeltaTone;
  /** The shape behind the number: pass a <Sparkline>. */
  trend?: ReactNode;
  /** `md` in a row of tiles, `lg` for the one figure a screen is built around. A row where every
   *  tile is lg has no hierarchy.
   */
  size?: Size;
};

const ARROW: Record<DeltaDirection, IconName> = { up: "arrow_upward", down: "arrow_downward", flat: "remove" };

/** A KPI tile: a large value with a caption, and — when the number is judged
 *  rather than just read — the comparison and the trend behind it. Compose
 *  inside a <Card> for a bordered surface, or use bare in a <Grid>. 
 *
 * Copy: the label says what the number counts, with its unit and its period —
 * "Invoices paid this quarter". The delta says what it is compared to, or
 * it is not a comparison.
 */
export function Stat({
  value,
  label,
  tone = "neutral",
  unit,
  delta,
  deltaDirection,
  deltaTone = "neutral",
  trend,
  size,
  className,
  ...rest
}: Props) {
  return (
    <div className={cn("stat", className)} data-tone={tone} data-size={size} {...rest}>
      <div className="stat-value">
        {value}
        {unit && <span className="stat-unit">{unit}</span>}
        {delta != null && (
          <span className="stat-delta" data-delta-tone={deltaTone} data-delta-direction={deltaDirection}>
            {deltaDirection && <Icon name={ARROW[deltaDirection]} size="sm" />}
            {delta}
          </span>
        )}
      </div>
      <div className="stat-label">{label}</div>
      {trend && <div className="stat-trend">{trend}</div>}
    </div>
  );
}
