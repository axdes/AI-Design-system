import './Card.css'
import './CardMedia.css'
import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { Button } from '../Button'
import { Icon } from '../Icon'

type Props = HTMLAttributes<HTMLDivElement> & {
  /** Removes border + base shadow; adds cursor + hover shadow. */
  interactive?: boolean
  /** No border, no shadow — flat surface. For non-clickable info cards. */
  flat?: boolean
  /** Stretches to fill its grid/flex cell vertically. */
  fill?: boolean
  /** Tight internal gap (6px) instead of default 18px. */
  tight?: boolean
  /** No padding at all - for full-bleed content (tables) where rows manage
   * their own edge spacing and divider lines must meet the card frame. */
  flush?: boolean
}

/**
 * The surface a block of content sits on. Header, title, meta and footer
 * arrive as slots; `interactive` makes the whole card one target, `tight` and
 * `fill` tune its padding.
 */
export function Card({ interactive, flat, fill, tight, flush, className, ...rest }: Props) {
  return (
    <div
      className={cn('card', className)} data-raised="card"
      data-interactive={interactive || undefined}
      data-flat={flat || undefined}
      data-fill={fill || undefined}
      data-tight={tight || undefined}
      data-flush={flush || undefined}
      {...rest}
    />
  )
}

/** Level 1: the KIND of thing and its status, at the START of the row — never
 *  a label at the far edge, which is CardCorner's and costs the title width. */
export function CardHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('card-header', className)} {...rest} />
}

type CardTitleProps = HTMLAttributes<HTMLHeadingElement> & {
  /** Defaults to h2 to avoid heading-level skips below a page h1. */
  as?: 'h2' | 'h3' | 'h4'
  /**
   * Where the card goes. A card's title IS its link (owner's rule, 23.08), so
   * this renders the title as the control that opens it and stretches that
   * control's hit area over the whole card: ONE accessible name, ONE focus
   * stop, and a keyboard can reach it — which a click handler on the card's
   * div never could.
   */
  onOpen?: () => void
}

export function CardTitle({ as: Tag = 'h2', onOpen, children, className, ...rest }: CardTitleProps) {
  return (
    <Tag className={cn('card-title', className)} {...rest}>
      {onOpen ? (
        <Button variant="link" className="card-link" onClick={onOpen}>
          {children}
        </Button>
      ) : (
        children
      )}
    </Tag>
  )
}

/** The card's top-right corner: its menu, a pin, a bookmark. Sits over the
 *  title's hit area; the first block makes room so no name runs under it. */
export function CardCorner({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('card-corner card-above', className)} {...rest} />
}

export function CardMeta({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('card-meta', className)} {...rest} />
}

type CardMediaProps = HTMLAttributes<HTMLDivElement> & {
  /**
   * Where the media sits. `top` bleeds edge-to-edge above the content, `side`
   * is a fixed column beside it (a horizontal card), `cover` puts the card's
   * OWN content on top of the media — and brings the scrim with it, because
   * text never sits on raw imagery.
   */
  placement?: 'top' | 'side' | 'cover'
  /** A tinted media block for photograph-less covers (a training, a category tile): the brand gradient or ink. Children (an image) win over the wash. */
  wash?: 'brand' | 'ink'
  /** This media PLAYS. Draws the play affordance over the frame, so a card that
   *  starts a recording does not look identical to one that opens a document.
   *  Decoration only: the card itself stays the single target. */
  playable?: boolean
  /** How long it runs, in the corner of the frame ("12:04"). The other half of
   *  the same promise: what the reader is agreeing to before they press. */
  duration?: ReactNode
  /** Holds the frame to a shape whatever sits in it. For content that is NOT
   *  ours — an embedded player, a board, a document preview — where the height
   *  would otherwise be decided by the guest. */
  ratio?: '16/9' | '4/3' | '1/1'
}

/**
 * The card's media slot: an image, a video poster, an icon tile or a `tone`
 * tint. One slot, three placements — which one is a decision about the
 * CONTENT (see the registry's guidance), not a new component.
 */
export function CardMedia({ placement = 'top', wash, playable, duration, ratio, className, children, ...rest }: CardMediaProps) {
  return (
    <div
      className={cn('card-media', className)}
      data-placement={placement}
      data-wash={wash}
      data-playable={playable || undefined}
      data-ratio={ratio}
      {...rest}
    >
      {children}
      {playable && (
        <span className="card-media-play" aria-hidden="true">
          <Icon name="play" size="lg" />
        </span>
      )}
      {duration && <span className="card-media-duration">{duration}</span>}
    </div>
  )
}
