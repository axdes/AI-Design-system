import "./ActionCard.css";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import { Card, CardHeader, CardTitle } from "../Card";
import { Icon, type IconName } from "../Icon";
import { MetaItem } from "../MetaItem";

type Tone = "success" | "danger" | "neutral";

type Resolved = {
  /** What the answer was: success for the affirmative one, danger for the
   *  refusal, neutral for anything that expired or was withdrawn. */
  tone: Tone;
  /** The outcome as a sentence in the past tense: "Approved by you, 10:24". */
  text: ReactNode;
};

type Props = {
  /** The question, in the words the reader would use to answer it. */
  title: ReactNode;
  /** The answers, as <Button>s. Two is the usual number; three is the limit
   *  before the card is really a form. */
  actions: ReactNode;
  /** What kind of request this is: "Approval", "Access request". */
  eyebrow?: ReactNode;
  /** Facts the decision needs: who asked, when, how much. */
  meta?: ReactNode;
  /** The context of the request — a Descriptions of fields, a paragraph, an
   *  Identity of who is asking. */
  children?: ReactNode;
  /** Once answered, the card states the outcome instead of the actions, so
   *  nobody answers twice and nobody wonders whether it went through. */
  resolved?: Resolved;
  className?: string;
};

const ICON: Record<Tone, IconName> = { success: "check_circle", danger: "close", neutral: "info" };

/** A question put to THIS reader, answered on the spot: the ask, the context it
 *  needs, the answers, and — once given — the outcome in place of them. Reach
 *  for <Alert> when the card only informs, and for a plain <Card> when the
 *  decision really happens on another screen. 
 *
 * Copy: the title is the question put to THIS reader, phrased as a question. The
 * body carries only what the answer needs; anything else belongs behind
 * the record.
 */
export function ActionCard({ title, actions, eyebrow, meta, children, resolved, className }: Props) {
  return (
    <Card className={cn("action-card", className)} data-resolved={resolved ? resolved.tone : undefined}>
      {eyebrow && (
        <CardHeader>
          <MetaItem appearance="eyebrow">{eyebrow}</MetaItem>
        </CardHeader>
      )}
      <CardTitle>{title}</CardTitle>
      {children}
      {meta && <div className="action-card-meta">{meta}</div>}
      {resolved ? (
        <p className="action-card-outcome" data-tone={resolved.tone}>
          <Icon name={ICON[resolved.tone]} size="sm" />
          {resolved.text}
        </p>
      ) : (
        <div className="action-card-actions">{actions}</div>
      )}
    </Card>
  );
}
