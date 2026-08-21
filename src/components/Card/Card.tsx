import './Card.css'
import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

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
      className={cn('card', className)}
      data-interactive={interactive || undefined}
      data-flat={flat || undefined}
      data-fill={fill || undefined}
      data-tight={tight || undefined}
      data-flush={flush || undefined}
      {...rest}
    />
  )
}

export function CardHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('card-header', className)} {...rest} />
}

type CardTitleProps = HTMLAttributes<HTMLHeadingElement> & {
  /** Defaults to h2 to avoid heading-level skips below a page h1. */
  as?: 'h2' | 'h3' | 'h4'
}

export function CardTitle({ as: Tag = 'h2', className, ...rest }: CardTitleProps) {
  return <Tag className={cn('card-title', className)} {...rest} />
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
}

/**
 * The card's media slot: an image, a video poster, an icon tile or a `tone`
 * tint. One slot, three placements — which one is a decision about the
 * CONTENT (see the registry's guidance), not a new component.
 */
export function CardMedia({ placement = 'top', wash, className, ...rest }: CardMediaProps) {
  return (
    <div
      className={cn('card-media', className)}
      data-placement={placement}
      data-wash={wash}
      {...rest}
    />
  )
}
