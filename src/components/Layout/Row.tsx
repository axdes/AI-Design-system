import './Layout.css'
import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type Gap = 1 | 2 | 3 | 4 | 6 | 8 | 12 | 16

type Props = HTMLAttributes<HTMLDivElement> & {
  /** Space between the children, as a step of the 4pt scale. On the container,
   *  never as margins on the children: margins collapse and double, a gap does
   *  neither. */
  gap?: Gap
  align?: 'start' | 'center' | 'end'
  /** Where the row's content sits on the main axis. `center` is the one action
   *  under a card's content; `end` is a toolbar's trailing edge. Added 2026-08-22:
   *  the row could only spread, so every screen that needed a centred control
   *  wrote its own class for it. */
  justify?: 'between' | 'center' | 'end'
  /**
   * Keeps the row on ONE line. A row wraps by default, which is right for a
   * group of controls and wrong for a pair that means one thing — a mark beside
   * a label, a figure beside its unit. Without it the mark dropped onto a line
   * of its own the moment the words needed the space, so the same tile showed
   * the icon beside the title in a wide card and above it in a narrow one
   * (owner, 2026-08-25).
   *
   * The item that must give way needs a floor of zero; that is the caller's,
   * because only the caller knows which of the two it is.
   */
  nowrap?: boolean
  /** Takes the whole main axis of the flex parent it sits in. Without it a Row
   *  is only as wide as its contents, so `justify="center"` centres them inside
   *  that width and the group still sits wherever the parent put it — which is
   *  how a centred action row under a portrait ended up left-aligned inside
   *  <CardMeta> (owner, 23.08). */
  grow?: boolean
}

export function Row({ gap = 3, align, justify, grow, nowrap, className, ...rest }: Props) {
  return (
    <div
      className={cn('row', className)}
      data-gap={gap}
      data-align={align}
      data-justify={justify}
      data-grow={grow || undefined}
      data-nowrap={nowrap || undefined}
      {...rest}
    />
  )
}
