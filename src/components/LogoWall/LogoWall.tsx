import "./LogoWall.css";
import { cn } from "../../lib/cn";

type Size = "sm" | "md" | "lg";

export type Logo = {
  src: string;
  /** The organisation's name. Never empty: the mark IS the information here, so
   *  a reader who cannot see it still has to learn who is on the wall. */
  alt: string;
};

type Props = {
  logos: Logo[];
  /** How much the row carries: `md` when the wall is a section of its own, `sm` under a heading
   *  as supporting evidence.
   */
  size?: Size;
  /** Full colour instead of the normalised weight. For one row of partners the
   *  client insisted on; the default exists because unlike marks at full
   *  strength read as a jumble. */
  colour?: boolean;
  /** What the wall is: "Customers", "Partners". */
  label?: string;
  className?: string;
};

/** Customer or partner marks in ONE optical weight: unlike logos are drawn at
 *  unlike strengths, and a row of them at full colour reads as noise rather
 *  than as proof. Normalising that is systems work — done per page it is done
 *  by eye, and looks it. 
 *
 * Copy: every `alt` is the organisation's name in full. The mark IS the
 * information here, so a reader who cannot see it learns who is on the
 * wall only from that word.
 */
export function LogoWall({ logos, size, colour, label, className }: Props) {
  if (!logos.length) return null;
  return (
    <ul className={cn("logo-wall", className)} data-size={size} data-colour={colour ? "" : undefined} aria-label={label}>
      {logos.map((l) => (
        <li key={l.src}>
          <img src={l.src} alt={l.alt} />
        </li>
      ))}
    </ul>
  );
}
