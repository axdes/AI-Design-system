import './ButtonGroup.css'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Props = {
  /** The buttons. Two or three; past that it is a toolbar, not one control. */
  children: ReactNode
  /** Announced name for the group, e.g. "Save options". */
  label: string
  /** Which fill the halves carry, so the SEAM between them can match it:
   *  `primary` for a split primary action (a brand pill divided by a darker
   *  step of the brand), `neutral` when the halves are quiet controls and the
   *  divider is the ordinary control edge. Default 'neutral'. */
  tone?: 'neutral' | 'primary'
  className?: string
}

/**
 * Two or three buttons that are one decision: "Save" beside the menu of other
 * ways to save. They are welded into one pill — the radii flatten where they
 * meet and a hairline separates them, because a gap says "two things". There is
 * no loose variant on purpose: a row of buttons with space between them is a
 * row of buttons, and `<Layout direction="row" gap>` already builds it.
 *
 * For the commonest case of all — an action beside its own menu of alternatives
 * — reach for `<MenuButton onClick>`, which welds this group around a Button and
 * a Dropdown and cannot forget the accessible name on the chevron half. This
 * component is the seam underneath it, for the pairs it does not cover.
 *
 * Copy: the group's name says what the pair decides — "Save options" — and the
 * halves keep the same verb, so the menu reads as more ways to do the
 * thing the button does.
 */
export function ButtonGroup({ children, label, tone, className }: Props) {
  return (
    <div className={cn('button-group', className)} data-tone={tone} role="group" aria-label={label}>
      {children}
    </div>
  )
}
