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

const GAP = 8
const EDGE = 8

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
  const measure = useCallback((): Position | null => {
    const t = triggerRef.current
    const panel = layerRef.current
    if (!t || !panel) return null
    const r = t.getBoundingClientRect()
    const pw = panel.offsetWidth
    const ph = panel.offsetHeight
    const below = r.bottom + GAP
    const above = r.top - GAP - ph
    const flip = placement === 'bottom' ? below + ph > window.innerHeight && above > EDGE : above > EDGE
    const top = flip ? above : (placement === 'bottom' ? below : r.top - GAP - ph)
    const left = Math.min(Math.max(EDGE, r.left), window.innerWidth - pw - EDGE)
    return { top: Math.max(EDGE, top), left }
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
