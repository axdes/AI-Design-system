import './Popover.css'
import {
  useCallback,
  useEffect,
  useId,
  useState,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/cn'
import { useAnchoredLayer } from '../../lib/useAnchoredLayer'
import { readAnchor, computePlacement } from '../../lib/placement'

export type PopoverTriggerProps = {
  ref: Ref<HTMLButtonElement>
  onClick: (e: MouseEvent) => void
  'aria-haspopup': 'dialog'
  'aria-expanded': boolean
  'aria-controls': string
}

type Props = {
  /** Render the control that opens the popover; spread the given props onto it. */
  trigger: (props: PopoverTriggerProps) => ReactNode
  children: ReactNode
  /** Accessible name for the popover dialog. */
  label: string
  /** Preferred side; flips to the other if there is not enough room. Default 'bottom'. */
  placement?: 'top' | 'bottom'
  className?: string
}

type Position = { top: number; left: number }

/* The gap and the edge padding are MENU_MARGIN and EDGE_PAD in lib/placement.ts
 * now, where the arithmetic that uses them lives. Two components holding their
 * own copy of the same two numbers is how a system gets two distances that mean
 * one thing. (2026-09-03) */

/* Portaled and positioned below the trigger: flips up when tight, clamps to the
 * viewport edge. */

/** Click-triggered floating panel for RICH content: a form, a group of controls,
 *  a detail card. <Tooltip> is text on hover, <Dropdown> is a menu of items; this
 *  is neither. Closes on outside click or Escape, returning focus to the trigger.
 *  The content is a labelled role="dialog". 
 *
 * Copy: the accessible name says what the panel holds, because it is a dialog
 * and announces itself before its content.
 */
export function Popover({ trigger, children, label, placement = 'bottom', className }: Props) {
  const [open, setOpen] = useState(false)
  const panelId = useId()

  const close = useCallback(() => {
    setOpen(false)
    triggerRef.current?.focus()
  }, [])

  /* WHERE the panel goes. The listeners, the rAF throttling, the mount timing
     and the two dismissals are `useAnchoredLayer`'s — shared with <Dropdown>,
     which is where Popover picked up the throttled reflow it never had. */
  /* The arithmetic is computePlacement's, not this component's. It was written
   * out here — the flip, the edge clamp, the gap — and that made three of the
   * seven recorded "written twice" pairs, because the same six lines sat in
   * Dropdown and HoverCard through the shared function while this one kept its
   * own. The only thing Popover asks for that a menu does not is a preferred
   * side, so that became an input to the shared function. (2026-09-03) */
  const measure = useCallback((): Position | null => {
    const t = triggerRef.current
    const panel = layerRef.current
    if (!t || !panel) return null
    const anchor = readAnchor(t, panel)
    if (!anchor) return null
    const p = computePlacement({ ...anchor, align: 'start', prefer: placement === 'bottom' ? 'below' : 'above' })
    return { top: p.top, left: p.left ?? Math.max(0, window.innerWidth - panel.offsetWidth - (p.right ?? 0)) }
  }, [placement])

  const { triggerRef, layerRef, setLayer, position: pos } = useAnchoredLayer<Position>({
    open,
    onClose: close,
    measure,
  })

  /* Move focus into the panel on open. */
  useEffect(() => {
    if (open) layerRef.current?.focus()
  }, [open, layerRef])

  const triggerProps: PopoverTriggerProps = {
    ref: (el) => { triggerRef.current = el },
    onClick: (e) => { e.stopPropagation(); setOpen((v) => !v) },
    'aria-haspopup': 'dialog',
    'aria-expanded': open,
    'aria-controls': panelId,
  }

  return (
    <>
      {trigger(triggerProps)}
      {open &&
        createPortal(
          <div
            ref={setLayer}
            id={panelId}
            role="dialog"
            aria-label={label}
            tabIndex={-1}
            className={cn('popover', className)} data-raised="popover"
            style={pos ? { top: pos.top, left: pos.left } : { visibility: 'hidden' }}
          >
            {children}
          </div>,
          document.body,
        )}
    </>
  )
}
