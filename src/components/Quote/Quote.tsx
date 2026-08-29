import "./Quote.css";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import { Icon } from "../Icon";

type Size = "md" | "lg";

type Props = {
  /** The words. Somebody else's, which is the whole point of the component. */
  children: ReactNode;
  /** Who said it: an <Identity>, or a name and a role. Required, because an
   *  unattributed quote proves nothing — it is copy we wrote about ourselves. */
  by: ReactNode;
  /** Where it comes from: a company, a report, a date. */
  source?: ReactNode;
  /** How much of the page the quote is ASKING FOR. `md` sits inside something else that carries
   *  on around it; `lg` is the pull quote a section is built around, and a page gets one.
   */
  size?: Size;
  className?: string;
};

/** A quotation with its attribution, in real <figure>/<blockquote> semantics —
 *  a testimonial, a finding quoted from a report, a line from an interview.
 *  For the system's own voice use ordinary text; this is for someone else's. 
 *
 * Copy: the words are the speaker's, unedited; trimming a quote to fit is how a
 * testimonial stops being one. `by` is a person, `source` is where they
 * said it or what they do — an unattributed quote is copy, not evidence.
 */
export function Quote({ children, by, source, size, className }: Props) {
  return (
    <figure className={cn("quote", className)} data-size={size}>
      <Icon name="quote" size="md" className="quote-mark" aria-hidden="true" />
      <blockquote className="quote-body">{children}</blockquote>
      <figcaption className="quote-by">
        {by}
        {source && <span className="quote-source">{source}</span>}
      </figcaption>
    </figure>
  );
}
