import './HoverCard.css'
import { cloneElement, useCallback, useId, useRef, useState, type ReactElement, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { readAnchor, computePlacement, type Placement } from '../../lib/placement'
import { useAnchoredLayer } from '../../lib/useAnchoredLayer'
import { cn } from '../../lib/cn'
import { composeRefs } from '../../lib/composeRefs'
import { useTimer } from '../../lib/useTimer'

type ChildProps = {
  ref?: React.Ref<HTMLElement>
  onMouseEnter?: (e: React.MouseEvent) => void
  onMouseLeave?: (e: React.MouseEvent) => void
  onFocus?: (e: React.FocusEvent) => void
  onBlur?: (e: React.FocusEvent) => void
  'aria-describedby'?: string
}

type Props = {
  /** The element that reveals the card on hover/focus. */
  children: ReactElement<ChildProps>
  /** Rich content of the card. */
  content: ReactNode
  /** Delay before it opens (ms). Default 200. */
  openDelay?: number
  className?: string
}


/* Hover-triggered rich card — a profile preview on a name, a definition on a
 * term. Opens on hover OR focus (keyboard-reachable), closes when the pointer
 * leaves both trigger and card. For text-only hints use <Tooltip>; for a
 * click-triggered panel use <Popover>. */
export function HoverCard({ children, content, openDelay = 200, className }: Props) {
  const [open, setOpen] = useState(false)
  /* One pending timer, cleared before the next and on unmount: src/lib/useTimer.ts,
   * shared with <Tooltip>, which wrote the same six lines. */
  const { after, cancel } = useTimer()
  const overCardRef = useRef(false)
  const id = useId()


  /* THE ARITHMETIC IS `computePlacement`'S, and it was hand-rolled here as
   * `{ top: rect.bottom + GAP, left: max(EDGE, rect.left) }` — always below,
   * always left-aligned, and off the right edge of the window whenever the
   * trigger sat near it. The shared function flips the card above when there is
   * no room below and pins it to the trigger's right edge when it would
   * overflow, which is the same answer <Dropdown> and <Select> already give.
   * The card's own size is what those two decisions need, so it is read from
   * the layer once it exists; on the first pass it is zero and the measurement
   * re-runs on mount, which is what the hook's `mounted` flag is for. */
  const measure = useCallback((): Placement | null => {
    const t = triggerRef.current
    if (!t) return null
    const anchor = readAnchor(t, layerRef.current)
    if (!anchor) return null
    return computePlacement({ ...anchor, align: 'start' })
  }, [])

  const close = useCallback(() => {
    cancel()
    setOpen(false)
  }, [cancel])

  /* Escape and an outside press arrive with the hook. This component had
   * NEITHER: SC 1.4.13 asks that content shown on hover be dismissible without
   * moving the pointer, and until 2026-08-31 the only way out of a hover card
   * was to move off it. Nor did it follow the page — it measured once, so a
   * scroll left the card behind. Both are the shared mechanism's, and neither
   * would have been fixed in a component that owned its own copy of it. */
  const { triggerRef, layerRef, setLayer, position } = useAnchoredLayer<Placement>({ open, onClose: close, measure })

  const show = () => after(openDelay, () => { setOpen(true) })
  /* 120ms is the pointer's travel time from the trigger onto the card: close any
   * sooner and the card runs away from the hand reaching for it. */
  const scheduleClose = () => after(120, () => { if (!overCardRef.current) setOpen(false) })

  /* Compose, do not replace: cloneElement overwrites the child's ref, so without
   * this any ref the caller had on the element would silently stop being filled
   * the moment they wrapped it in a HoverCard. */
  // eslint-disable-next-line @eslint-react/no-clone-element, react-hooks/refs -- injects hover/focus handlers into the trigger without an extra wrapper span; the ref below is composed, not read
  const child = cloneElement(children, {
    // eslint-disable-next-line react-hooks/refs -- composeRefs only stores these; React calls the result at commit, nothing is read during render
    ref: composeRefs<HTMLElement>(triggerRef, (children as ReactElement<ChildProps>).props.ref),
    onMouseEnter: (e: React.MouseEvent) => { show(); children.props.onMouseEnter?.(e) },
    onMouseLeave: (e: React.MouseEvent) => { scheduleClose(); children.props.onMouseLeave?.(e) },
    onFocus: (e: React.FocusEvent) => { setOpen(true); children.props.onFocus?.(e) },
    onBlur: (e: React.FocusEvent) => { scheduleClose(); children.props.onBlur?.(e) },
    'aria-describedby': open && position ? id : children.props['aria-describedby'],
  })

  return (
    <>
      {child}
      {open && position && createPortal(
        <div
          ref={setLayer}
          id={id}
          role="tooltip"
          className={cn('hover-card', className)}
          data-raised="popover"
          style={position}
          onMouseEnter={() => { overCardRef.current = true }}
          onMouseLeave={() => { overCardRef.current = false; scheduleClose() }}
        >
          {content}
        </div>,
        document.body,
      )}
    </>
  )
}
