import "./CardStack.css";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import { Button } from "../Button";
import { Card, CardMeta } from "../Card";

type Props = {
  /** How many there are in total, including the one on top. */
  count: number;
  /** Opening the pile. With `onNext` this is a named button; without it the
   *  whole card is the target, named for a screen reader by `label`. */
  onSelect: () => void;
  /** What the pile IS: "12 audits waiting on you". Read instead of the visual
   *  layering, which says nothing out loud. */
  label: string;
  /** The card on top — the usual card content, whatever family it belongs to. */
  children: ReactNode;
  /** Put the top card behind the pile and bring up the next one. Give it and
   *  the pile grows a pair of controls: the deck becomes something you can work
   *  through in place, which is the whole point of a pile you can see the edges
   *  of. The caller owns which card is on top, the way <Tabs> owns its value. */
  onNext?: () => void;
  /** The two button labels. Required with `onNext` — this package ships no UI
   *  text of its own. */
  nextLabel?: string;
  openLabel?: string;
  className?: string;
};

/** Many cards of one kind, shown as one: the top card, the count, and a way
 *  into the pile. An overview has room for one card per topic; when a topic has
 *  twenty instances the topic keeps its slot and the instances go behind it.
 *  Below about five, show them — a stack of three hides nothing and costs a
 *  click. With `onNext` the pile is also a queue you can work through in place.
 *
 * Copy: the label names the pile and the open control counts it — "Open all 9
 * findings". A count with no noun is a number nobody can act on.
 */
export function CardStack({ count, onSelect, label, children, onNext, nextLabel, openLabel, className }: Props) {
  const worked = Boolean(onNext && nextLabel && openLabel);
  /* The name of the pile goes wherever the pile's target is: on the card while
   * the card IS the target, on the group once two buttons are. Both at once is
   * the same name announced twice. */
  return (
    <div
      className={cn("card-stack", className)}
      data-count={count}
      role={worked ? "group" : undefined}
      aria-label={worked ? label : undefined}
    >
      {/* Two named controls or one big target, never both: a card that is itself
          a button swallows the click meant for the button inside it. */}
      <Card interactive={!worked} onClick={worked ? undefined : onSelect} aria-label={worked ? undefined : label}>
        {children}
        <span className="card-stack-count" aria-hidden="true">
          {count}
        </span>
        {worked && (
          <CardMeta className="card-stack-actions">
            <Button variant="secondary" size="sm" onClick={onNext}>
              {nextLabel}
            </Button>
            <Button size="sm" onClick={onSelect}>
              {openLabel}
            </Button>
          </CardMeta>
        )}
      </Card>
    </div>
  );
}
