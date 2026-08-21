import "./Stat.css";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

type Tone = "neutral" | "primary" | "success" | "warning" | "ai";
type Size = "md" | "lg";

type Props = HTMLAttributes<HTMLDivElement> & {
  /** The headline metric (rendered tabular-nums). */
  value: ReactNode;
  /** Caption under the value. */
  label: ReactNode;
  /** Semantic emphasis for the value. */
  tone?: Tone;
  /** Small suffix after the value, e.g. "/3" or "%". */
  unit?: string;
  size?: Size;
};

/** A KPI tile: a large value with a caption. Compose inside a <Card> for a
 *  bordered surface, or use bare in a <Grid>. */
export function Stat({ value, label, tone = "neutral", unit, size, className, ...rest }: Props) {
  return (
    <div className={cn("stat", className)} data-tone={tone} data-size={size} {...rest}>
      <div className="stat-value">
        {value}
        {unit && <span className="stat-unit">{unit}</span>}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
