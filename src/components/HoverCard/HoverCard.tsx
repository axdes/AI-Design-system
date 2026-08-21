import './HoverCard.css'
import { cloneElement, useEffect, useId, useRef, useState, type ReactElement, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/cn'
import { composeRefs } from '../../lib/composeRefs'

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

const GAP = 8
const EDGE = 8

/* Hover-triggered rich card — a profile preview on a name, a definition on a
 * term. Opens on hover OR focus (keyboard-reachable), closes when the pointer
 * leaves both trigger and card. For text-only hints use <Tooltip>; for a
 * click-triggered panel use <Popover>. */
export function HoverCard({ children, content, openDelay = 200, className }: Props) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const cardRef = useRef<HTMLDivElement | null>(null)
  const timerRef = useRef<number | null>(null)
  const overCardRef = useRef(false)
  const id = useId()

  useEffect(() => () => { if (timerRef.current) window.clearTimeout(timerRef.current) }, [])

  const place = () => {
    const t = triggerRef.current
    if (!t) return
    const r = t.getBoundingClientRect()
    setPos({ top: r.bottom + GAP, left: Math.max(EDGE, r.left) })
  }
  const open = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(place, openDelay)
  }
  const scheduleClose = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => { if (!overCardRef.current) setPos(null) }, 120)
  }

  /* Compose, do not replace: cloneElement overwrites the child's ref, so without
   * this any ref the caller had on the element would silently stop being filled
   * the moment they wrapped it in a HoverCard. */
  // eslint-disable-next-line @eslint-react/no-clone-element, react-hooks/refs -- injects hover/focus handlers into the trigger without an extra wrapper span; the ref below is composed, not read
  const child = cloneElement(children, {
    // eslint-disable-next-line react-hooks/refs -- composeRefs only stores these; React calls the result at commit, nothing is read during render
    ref: composeRefs<HTMLElement>(triggerRef, (children as ReactElement<ChildProps>).props.ref),
    onMouseEnter: (e: React.MouseEvent) => { open(); children.props.onMouseEnter?.(e) },
    onMouseLeave: (e: React.MouseEvent) => { scheduleClose(); children.props.onMouseLeave?.(e) },
    onFocus: (e: React.FocusEvent) => { place(); children.props.onFocus?.(e) },
    onBlur: (e: React.FocusEvent) => { scheduleClose(); children.props.onBlur?.(e) },
    'aria-describedby': pos ? id : children.props['aria-describedby'],
  })

  return (
    <>
      {child}
      {pos && createPortal(
        <div
          ref={cardRef}
          id={id}
          role="tooltip"
          className={cn('hover-card', className)}
          style={{ top: pos.top, left: pos.left }}
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
