import "./ContentCard.css";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import { Card, CardMedia, CardMeta, CardTitle } from "../Card";

/** Where the media sits and which way the entry reads. `row` is the list form:
 *  no surface of its own, a hairline between neighbours. */
type Layout = "auto" | "tile" | "side" | "cover" | "row";
/** How much of the anatomy survives. Orthogonal to the layout: a tile can be
 *  dense and a row can be comfortable. */
type Density = "comfortable" | "compact" | "dense";

type Props = {
  /** What it is called, in the reader's words. The one part that never drops. */
  title: ReactNode;
  /** Picture, frame or wash. Omit and the entry is words only. */
  media?: ReactNode;
  /** What KIND of thing this is, above the title. */
  eyebrow?: ReactNode;
  /** The first sentences, so the reader can judge without opening. Clamped by
   *  the layout rather than cut by hand. */
  excerpt?: ReactNode;
  /** Provenance: author, date, counts. Pinned to the foot. */
  meta?: ReactNode;
  /** What can be done, named. One primary at most — if `onSelect` is given, the
   *  whole entry is already the way in. */
  actions?: ReactNode;
  /** Makes the whole entry one target. */
  onSelect?: () => void;
  /** Where the media sits and which way the entry reads. `auto` (the default)
   *  lets it answer its OWN width: a row with a thumbnail under 360px, a
   *  tile up to 560, media beside the words above it. Name a layout to fix it,
   *  and `row` for the list form — no surface, a hairline between neighbours. */
  layout?: Layout;
  /** How much of the anatomy survives; the entry degrades from the bottom up.
   *  `compact` drops the excerpt, `dense` is a single reading line. The default
   *  keeps everything and lets `auto` decide by width. */
  density?: Density;
  /** Stretches to fill its grid cell. Only when stretching buys the reader
   *  something — on a plain card it buys a hole above the meta. */
  fill?: boolean;
  className?: string;
};

const PLACEMENT: Record<Layout, "top" | "side" | "cover" | undefined> = {
  auto: "top",
  tile: "top",
  side: "side",
  cover: "cover",
  row: undefined,
};

/** One CONTENT entry: media, eyebrow, title, excerpt, meta, actions — the six
 *  slots every feed shares, from a repo list to a news teaser.
 *
 *  ONE component, two surfaces. `layout` says where the media sits, and `row`
 *  is the list form: no card of its own, a hairline between neighbours, sized
 *  to sit inside a flush <Card>. `density` says how much of the anatomy
 *  survives, and the two are orthogonal — a tile can be dense, a row
 *  comfortable. ContentRow was a separate component until 2026-08-26; it had
 *  the same six slots in the same order, which is the definition of one thing
 *  in two forms.
 *
 *  The card reads its OWN width, not the window's: in a sidebar it is a row, in
 *  a grid a tile, across a feature strip a tile with the media beside the words.
 *  Reach for <Identity> when the item is a person, <Stat> when it is a number,
 *  and <ListItem> when the entry is one clickable line with no anatomy. 
 *
 * Copy: the eyebrow says what KIND of thing this is, the title is the entry's
 * own name, and the excerpt is the first sentences unedited — it exists so
 * the reader can skip the item without opening it, which a summary written
 * to fit cannot do.
 */
export function ContentCard({
  title,
  media,
  eyebrow,
  excerpt,
  meta,
  actions,
  onSelect,
  layout = "auto",
  density = "comfortable",
  fill,
  className,
}: Props) {
  const placement = PLACEMENT[layout];

  /* THE LIST FORM. It paints no surface of its own, because a list of entries
     lives inside one card and draws its own separators — a card per row is a
     stack of boxes, which is what every feed that tried it looks like. */
  if (layout === "row") {
    return (
      <div
        className={cn("content-card", className)}
        data-layout="row"
        data-density={density}
      >
        {media && <div className="content-card-media">{media}</div>}
        <div className="content-card-body">
          {/* The naming block is its own box so a `dense` row can put the
              footnote BESIDE it on one line while the other densities stack it
              underneath. Placing them in one grid instead needed
              `grid-row: 1 / -1` on the meta, and a row has no fixed number of
              lines (the eyebrow and the excerpt are both optional), so the span
              resolved against an explicit grid that was not there and dropped
              the meta a line below everything. One box, one flex rule. */}
          <div className="content-card-head">
            {eyebrow && <div className="content-card-eyebrow">{eyebrow}</div>}
            {onSelect ? (
              <button
                type="button"
                className="content-card-title content-card-open"
                onClick={onSelect}
              >
                {title}
              </button>
            ) : (
              <div className="content-card-title">{title}</div>
            )}
            {excerpt && <p className="content-card-excerpt">{excerpt}</p>}
          </div>
          {meta && <div className="content-card-meta">{meta}</div>}
        </div>
        {actions && <div className="content-card-actions">{actions}</div>}
      </div>
    );
  }

  return (
    <div
      className={cn("content-card", className)}
      data-layout={layout}
      data-density={density}
      data-fill={fill || undefined}
    >
      {/* The TITLE is the link, not the card's div: a click handler on a div is
          not reachable by keyboard, and the stretched `.card-link` gives the
          card one accessible name and one focus stop (owner's rule, 23.08:
          titles in cards are always links). */}
      <Card fill={fill} interactive={onSelect ? true : undefined}>
        {media && placement && <CardMedia placement={placement}>{media}</CardMedia>}
        {/* Eyebrow and title travel together: they are one level of the reading
            order, and on a row of cards they share one subgrid track. */}
        <div className="content-card-head">
          {eyebrow && <div className="content-card-eyebrow">{eyebrow}</div>}
          <CardTitle onSelect={onSelect}>{title}</CardTitle>
        </div>
        {excerpt && <p className="content-card-excerpt">{excerpt}</p>}
        {(meta || actions) && (
          <CardMeta>
            {meta}
            {actions && <span className="content-card-actions">{actions}</span>}
          </CardMeta>
        )}
      </Card>
    </div>
  );
}
