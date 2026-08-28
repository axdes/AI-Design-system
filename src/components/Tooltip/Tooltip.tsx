import './Tooltip.css'
import { composeRefs } from '../../lib/composeRefs'
import {
  cloneElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
} from 'react'
import { createPortal } from 'react-dom'

type Placement = 'top' | 'bottom' | 'end' | 'start'

type ChildProps = {
  ref?: React.Ref<HTMLElement>
  onMouseEnter?: (e: React.MouseEvent) => void
  onMouseLeave?: (e: React.MouseEvent) => void
  onPointerDown?: (e: React.PointerEvent) => void
  onFocus?: (e: React.FocusEvent) => void
  onBlur?: (e: React.FocusEvent) => void
  'aria-describedby'?: string
}

type Props = {
  /** What the control is CALLED — one or two words, the same verb it would
   *  carry if it had room. Not an explanation: a tooltip cannot be reached by
   *  touch, cannot be selected, and disappears the moment the pointer leaves, so
   *  anything the reader actually needs belongs on the page. On an icon-only
   *  control this is the VISIBLE name and `aria-label` is the announced one;
   *  both, always. */
  content: string
  /** Which side it prefers, chosen by the room available rather than the look —
   *  `start`/`end` beside a control at the edge of a panel, where a tooltip
   *  above it would be clipped. A preference, not an instruction: the layer
   *  flips itself when the chosen side does not fit. */
  placement?: Placement
  /** Hover delay before the tooltip appears (ms). Default 300. */
  delay?: number
  /** When false, renders children untouched. Default true. */
  enabled?: boolean
  children: ReactElement<ChildProps>
}

const GAP = 8
const EDGE_PAD = 8

/* Track the last input modality so focus only opens the tooltip for KEYBOARD
 * focus, not focus moved by a click or programmatically (e.g. a Modal
 * autofocusing its close button, which otherwise popped the tooltip on open).
 * This is the cross-environment stand-in for `:focus-visible`, which jsdom
 * always reports false, so gating on it directly would break keyboard tests. */
let lastInputWasKeyboard = false
let modalityBound = false
function trackModality() {
  if (modalityBound || typeof document === 'undefined') return
  modalityBound = true
  document.addEventListener('keydown', () => { lastInputWasKeyboard = true }, true)
  document.addEventListener('pointerdown', () => { lastInputWasKeyboard = false }, true)
}

type Resolved = {
  top: number
  left: number
  /* Transform string from the actual placement after collision-flip. */
  transform: string
}

/**
 * Text on hover and focus, and the only right answer for naming an icon-only
 * control. Popover is a card on click, Dropdown is a menu.
 *
 * Copy: names the control, it does not explain it. If the words are needed to
 * decide, they belong on the page — a tooltip is unreachable on a touch
 * screen and gone on the next keystroke.
 */
export function Tooltip({ content, placement = 'top', delay = 300, enabled = true, children }: Props) {
  const [pos, setPos] = useState<Resolved | null>(null)
  const childRef = useRef<HTMLElement | null>(null)
  const timerRef = useRef<number | null>(null)
  const id = useId()

  /* Bind the modality listeners once, and always cleanup the pending timeout on
   * unmount (prevents "setState on unmounted component" warnings). */
  useEffect(() => {
    trackModality()
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    }
  }, [])

  /* A trigger that goes DISABLED under the pointer never reports the pointer leaving.
   *
   * The browser stops dispatching mouse events to a disabled control, so `onMouseLeave` never
   * arrives and the tooltip stays on screen for ever - floating over content, describing a button
   * that is no longer under the cursor. Reported 2026-08-19 with two of them stranded at once on a
   * task list whose checkboxes disable themselves while the change is saving, which is the ordinary
   * shape of a button that does work: press, disable, re-enable.
   *
   * Watched rather than handled in `onClick`, because the trigger need not be a button and the
   * disabling need not be its own doing: a parent can disable it for any reason, and the tooltip is
   * just as stuck. Above the `enabled` return because a hook may not be called conditionally.
   */
  /* Escape closes it. SC 1.4.13 asks that content shown on hover or focus be
   * dismissible without moving the pointer or the focus, and until this existed
   * a tooltip could only be escaped by moving off the trigger — which on a
   * magnified screen means losing the thing you were reading about. Bound on the
   * document, in the capture phase, so it fires wherever focus happens to be. */
  useEffect(() => {
    if (!pos) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
      setPos(null)
    }
    document.addEventListener('keydown', onKey, true)
    return () => { document.removeEventListener('keydown', onKey, true) }
  }, [pos])

  useEffect(() => {
    if (!pos) return
    const el = childRef.current as (HTMLElement & { disabled?: boolean }) | null
    if (!el?.disabled) return
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    setPos(null)
  })

  if (!enabled) return children

  // eslint-disable-next-line sonarjs/cognitive-complexity -- collision-flip positioning across four placements; inherently branchy
  const show = () => {
    const el = childRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const isRtl = document.documentElement.dir === 'rtl'

    let p: Placement = placement
    if (isRtl && p === 'end') p = 'start'
    else if (isRtl && p === 'start') p = 'end'

    /* Collision-flip: if not enough room on requested side, flip to opposite. */
    const fits = {
      top:    rect.top - GAP - EDGE_PAD,
      bottom: vh - rect.bottom - GAP - EDGE_PAD,
      start:   rect.left - GAP - EDGE_PAD,
      end:  vw - rect.right - GAP - EDGE_PAD,
    }
    const minRoom = 32
    if (p === 'top'    && fits.top    < minRoom && fits.bottom > fits.top)    p = 'bottom'
    if (p === 'bottom' && fits.bottom < minRoom && fits.top    > fits.bottom) p = 'top'
    if (p === 'end'  && fits.end  < minRoom && fits.start   > fits.end)  p = 'start'
    if (p === 'start'   && fits.start   < minRoom && fits.end  > fits.start)   p = 'end'

    let top = 0, left = 0, transform = ''
    if (p === 'top') {
      top = rect.top - GAP
      left = rect.left + rect.width / 2
      transform = 'translate(-50%, -100%)'
    } else if (p === 'bottom') {
      top = rect.bottom + GAP
      left = rect.left + rect.width / 2
      transform = 'translate(-50%, 0)'
    } else if (p === 'end') {
      top = rect.top + rect.height / 2
      left = rect.right + GAP
      transform = 'translate(0, -50%)'
    } else /* start */ {
      top = rect.top + rect.height / 2
      left = rect.left - GAP
      transform = 'translate(-100%, -50%)'
    }
    setPos({ top, left, transform })
  }

  const open = () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(show, delay)
  }
  const close = () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    setPos(null)
  }


  /* Inject event handlers + aria-describedby directly into the child.
   * Avoids an extra wrapper span and gives screen readers a real association.
   * Compose ref: if caller already set one, forward to both our internal ref
   * and the caller's (callback OR mutable ref-object are both honored). */
  // eslint-disable-next-line react-hooks/refs -- composeRefs only stores these; React calls the result at commit
  const composedRef = composeRefs<HTMLElement>(childRef, (children as ReactElement<ChildProps>).props.ref)
  // eslint-disable-next-line @eslint-react/no-clone-element, react-hooks/refs -- injects hover/focus handlers into the trigger without an extra wrapper span
  const childWithHandlers = cloneElement(children, {
    ref: composedRef,
    /* Pressing a trigger dismisses its tooltip, the way every desktop tooltip behaves: the label
     * has been read, the press is the answer to it, and whatever the press changes is what the eye
     * should be on. It also covers the case above from the other side, before the disable lands. */
    onPointerDown: (e: React.PointerEvent) => { close(); children.props.onPointerDown?.(e) },
    onMouseEnter: (e: React.MouseEvent) => { open(); children.props.onMouseEnter?.(e) },
    onMouseLeave: (e: React.MouseEvent) => { close(); children.props.onMouseLeave?.(e) },
    onFocus:      (e: React.FocusEvent) => { if (lastInputWasKeyboard) { open() } children.props.onFocus?.(e) },
    onBlur:       (e: React.FocusEvent) => { close(); children.props.onBlur?.(e) },
    'aria-describedby': pos ? id : children.props['aria-describedby'],
  })

  return (
    <>
      {childWithHandlers}
      {pos && createPortal(
        <div
          id={id}
          role="tooltip"
          className="tooltip"
          ref={(node) => {
            /* The pill radius looks wrong once the text wraps; flag wrapped
             * tooltips so the CSS can switch to a rect radius. */
            if (!node) return
            const oneLine = parseFloat(getComputedStyle(node).lineHeight) * 1.5
            if (node.getBoundingClientRect().height > oneLine) node.dataset.multiline = 'true'
          }}
          style={{ top: pos.top, left: pos.left, transform: pos.transform }}
        >
          {content}
        </div>,
        document.body,
      )}
    </>
  )
}
