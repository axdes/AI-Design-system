import "./EntityLink.css";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import { Icon, type IconName } from "../Icon";

type View = "inline" | "card";

type Props = {
  /** What it is called where it lives — the issue key, the document title. */
  title: ReactNode;
  /** Where it goes. */
  href: string;
  /** Which system it lives in, as an icon: an audit, a document, a chat. */
  icon?: IconName;
  /** How much context the sentence owes: `inline` reads as a link inside running
   *  text, `card` gives the entity its own surface with the meta under it. The
   *  AUTHOR picks the view; the entity is the same either way. */
  view?: View;
  /** The entity's state — a <Badge>, kept out of the title so it can be read
   *  separately. */
  status?: ReactNode;
  /** Owner, date, size: shown in the card view, dropped inline. */
  meta?: ReactNode;
  className?: string;
};

/** One entity that lives ELSEWHERE, shown with enough of itself to be
 *  recognised: inline inside a sentence, or as a card with its state and its
 *  meta. Wrap it in <HoverCard> when the preview should appear on hover instead
 *  of on the page. 
 *
 * Copy: the title is the record's name; the meta says what is waiting inside it,
 * which is the reason to follow the link at all.
 */
export function EntityLink({ title, href, icon, view = "inline", status, meta, className }: Props) {
  return (
    <a className={cn("entity-link", className)} href={href} data-view={view}>
      {icon && <Icon name={icon} size={view === "card" ? "md" : "sm"} className="entity-link-icon" aria-hidden="true" />}
      <span className="entity-link-title">{title}</span>
      {status}
      {view === "card" && meta && <span className="entity-link-meta">{meta}</span>}
    </a>
  );
}
