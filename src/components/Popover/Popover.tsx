import './Popover.css'
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/cn'

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
 *  The content is a labelled role="dialog". */
export function Popover({ trigger, children, label, placement = 'bottom', className }: Props) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<Position | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const panelId = useId()

  const close = useCallback(() => {
    setOpen(false)
    triggerRef.current?.focus()
  }, [])

  const place = useCallback(() => {
    const t = triggerRef.current
    const panel = panelRef.current
    if (!t || !panel) return
    const r = t.getBoundingClientRect()
    const pw = panel.offsetWidth
    const ph = panel.offsetHeight
    const below = r.bottom + GAP
    const above = r.top - GAP - ph
    const flip = placement === 'bottom' ? below + ph > window.innerHeight && above > EDGE : above > EDGE
    const top = flip ? above : (placement === 'bottom' ? below : r.top - GAP - ph)
    const left = Math.min(Math.max(EDGE, r.left), window.innerWidth - pw - EDGE)
    // eslint-disable-next-line @eslint-react/set-state-in-effect -- positions the portal from measured geometry; not derivable during render
    setPos({ top: Math.max(EDGE, top), left })
  }, [placement])

  useLayoutEffect(() => {
    if (open) place()
  }, [open, place])

  /* Move focus into the panel on open. */
  useEffect(() => {
    if (open) panelRef.current?.focus()
  }, [open])

  /* Outside-click + Escape + reposition on scroll/resize while open. */
  useEffect(() => {
    if (!open) return
    const onDown = (e: globalThis.MouseEvent) => {
      const target = e.target as Node
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return
      close()
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); close() } }
    const onReflow = () => place()
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onReflow, true)
    window.addEventListener('resize', onReflow)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onReflow, true)
      window.removeEventListener('resize', onReflow)
    }
  }, [open, close, place])

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
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-label={label}
            tabIndex={-1}
            className={cn('popover', className)}
            style={pos ? { top: pos.top, left: pos.left } : { visibility: 'hidden' }}
          >
            {children}
          </div>,
          document.body,
        )}
    </>
  )
}
