import './Layout.css'
import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type Gap = 1 | 2 | 3 | 4 | 6 | 8 | 12 | 16
type Span = 3 | 4 | 6 | 8 | 9 | 12

type Props = HTMLAttributes<HTMLDivElement> & {
  /** Space between the tracks, as a step of the 4pt scale — spacing lives on the
   *  container, never as margins on the children. The scale is the whole point:
   *  a number that is not a step is a decision nobody made. */
  gap?: Gap
  /**
   * Twelve equal tracks instead of the auto-fitting default: the layout where
   * items are DIFFERENT sizes (a wide feature beside two narrow tiles), each
   * child wrapped in `GridItem` with its `span`. Omit it and every child gets
   * the same width, which is the right answer for a set of equals.
   */
  columns?: 12
  /**
   * The narrowest a card in this grid may get before the grid drops a column.
   * `sm` (16rem) is the default and right for tiles that carry a word or two;
   * `md` (20rem) is what a card with a name, a role and an action needs; `lg`
   * (24rem) is for a card with a picture and two sentences. Measured, not
   * guessed: at `sm` a person card came out 250px wide on a laptop and every
   * name broke over two lines.
   */
  min?: 'sm' | 'md' | 'lg'
  /**
   * How the children sit in their row. The default stretches them to the
   * tallest, and for CARDS that default is the rule: cards in a row are always
   * the same height (owner, 23.08). A ragged row is answered by giving the
   * short card the part it is missing, never by `start`. Use these values for a
   * grid of things that are not cards — captions, thumbnails, controls — where
   * a row of unequal boxes is what was asked for.
   */
  align?: 'start' | 'center' | 'end'
  /* Every card in a row sits on the SAME row tracks (CSS subgrid), so a long
   * title in one card no longer pushes its neighbour's excerpt and meta out of
   * line. Only <ContentCard> knows how to take part; other children are
   * unaffected. */
  /** Makes every row as tall as its tallest item, so cards in a grid line up
   *  across rows instead of each row setting its own height. Leave it off when
   *  the items are meant to be their own size. */
  alignRows?: boolean
}

/**
 * Layout primitives: Stack and Row for gaps in one direction, Grid for a set of
 * cards — auto-fitting equals by default, or `columns={12}` with `GridItem`
 * spans when the set is deliberately unequal. `gap` is a token step, never a
 * raw px.
 */
export function Grid({ gap = 4, columns, min, align, alignRows, className, ...rest }: Props) {
  return (
    <div
      className={cn('grid', className)}
      data-gap={gap}
      data-columns={columns}
      data-min={min}
      data-align={align}
      data-align-rows={alignRows || undefined}
      {...rest}
    />
  )
}

type ItemProps = HTMLAttributes<HTMLDivElement> & {
  /** Tracks of the twelve this item occupies: 3 = a quarter, 6 = a half, 12 = the row. */
  span?: Span
}

/**
 * One cell of a `columns={12}` Grid. Below the tablet breakpoint the twelve
 * tracks become six and every span rounds to a half or the full row; below the
 * phone breakpoint there is one column and spans stop meaning anything — a
 * quarter-width card is unreadable at 390px, and no span is worth that.
 */
export function GridItem({ span = 12, className, ...rest }: ItemProps) {
  return <div className={cn('grid-item', className)} data-span={span} {...rest} />
}
