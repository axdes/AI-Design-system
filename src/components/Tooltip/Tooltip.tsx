import './Tooltip.css'
import { composeRefs } from '../../lib/composeRefs'
import { useTimer } from '../../lib/useTimer'
import { readAnchor } from '../../lib/placement'
import { useAnchoredLayer } from '../../lib/useAnchoredLayer'
import {
  cloneElement,
  useCallback,
  useEffect,
  useId,
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
  const [open, setOpen] = useState(false)
  /* One pending timer, cleared before the next and on unmount: src/lib/useTimer.ts,
   * shared with <HoverCard>, which wrote the same six lines. */
  const { after, cancel } = useTimer()
  const id = useId()

  /* WHERE IT GOES IS STILL THIS COMPONENT'S QUESTION; everything around the
   * answer is not. `useAnchoredLayer` owns the listeners, the rAF-throttled
   * reflow, the mount timing and the two dismissals, and it existed before this
   * component used it: <Dropdown> and <Popover> each wrote that machinery, drifted,
   * and the hook is what stopped them. Tooltip and <HoverCard> then wrote it a
   * third and fourth time, which is how a tooltip ended up MEASURED ONCE — open
   * one and scroll, and until 2026-08-31 it stayed where the page used to be.
   * Moving to the hook is what fixes that, and it is not a fix anyone would have
   * made in four places. */
  // eslint-disable-next-line sonarjs/cognitive-complexity -- collision-flip across four placements; inherently branchy
  const measure = useCallback((): Resolved | null => {
    const el = triggerRef.current
    if (!el) return null
    /* The same three reads every anchored layer makes, made once in
     * lib/placement.ts. Only the arithmetic below is this component's: a tooltip
     * sits BESIDE its trigger on a chosen side, where a menu hangs under it. */
    const anchor = readAnchor(el, null)
    if (!anchor) return null
    const rect = anchor.trigger
    const vw = anchor.viewport.width
    const vh = anchor.viewport.height
    const rtl = anchor.isRtl

    let p: Placement = placement
    if (rtl && p === 'end') p = 'start'
    else if (rtl && p === 'start') p = 'end'

    /* Collision-flip: if not enough room on requested side, flip to opposite. */
    const fits = {
      top: rect.top - GAP - EDGE_PAD,
      bottom: vh - rect.bottom - GAP - EDGE_PAD,
      start: rect.left - GAP - EDGE_PAD,
      end: vw - rect.right - GAP - EDGE_PAD,
    }
    const minRoom = 32
    if (p === 'top' && fits.top < minRoom && fits.bottom > fits.top) p = 'bottom'
    if (p === 'bottom' && fits.bottom < minRoom && fits.top > fits.bottom) p = 'top'
    if (p === 'end' && fits.end < minRoom && fits.start > fits.end) p = 'start'
    if (p === 'start' && fits.start < minRoom && fits.end > fits.start) p = 'end'

    if (p === 'top') return { top: rect.top - GAP, left: rect.left + rect.width / 2, transform: 'translate(-50%, -100%)' }
    if (p === 'bottom') return { top: rect.bottom + GAP, left: rect.left + rect.width / 2, transform: 'translate(-50%, 0)' }
    if (p === 'end') return { top: rect.top + rect.height / 2, left: rect.right + GAP, transform: 'translate(0, -50%)' }
    return { top: rect.top + rect.height / 2, left: rect.left - GAP, transform: 'translate(-100%, -50%)' }
  }, [placement])

  const close = useCallback(() => {
    cancel()
    setOpen(false)
  }, [cancel])

  const { triggerRef, setLayer, position } = useAnchoredLayer<Resolved>({ open, onClose: close, measure })

  /* Bind the modality listeners once, and always cleanup the pending timeout on
   * unmount (prevents "setState on unmounted component" warnings). */
  /* The timeout is cleaned up by useTimer; this binds the modality listeners once. */
  useEffect(() => { trackModality() }, [])

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
  /* Escape is the shared dismissal now (useDismiss, inside the hook above), and
   * it arrives with the outside press beside it. SC 1.4.13 asks that content
   * shown on hover or focus be dismissible without moving the pointer or the
   * focus, and this component used to answer that with its own capture-phase
   * listener. Two differences, both deliberate: the shared one preventDefaults,
   * so one Escape dismisses one layer rather than a tooltip and the dialog
   * behind it at once, and a press anywhere outside now closes the tooltip too,
   * which is what every other transient layer in this system already did. */

  useEffect(() => {
    if (!open) return
    const el = triggerRef.current as (HTMLElement & { disabled?: boolean }) | null
    if (!el?.disabled) return
    cancel()
    setOpen(false)
  })

  if (!enabled) return children

  const show = () => after(delay, () => { setOpen(true) })

  /* Inject event handlers + aria-describedby directly into the child.
   * Avoids an extra wrapper span and gives screen readers a real association.
   * Compose ref: if caller already set one, forward to both our internal ref
   * and the caller's (callback OR mutable ref-object are both honored). */
  // eslint-disable-next-line react-hooks/refs -- composeRefs only stores these; React calls the result at commit
  const composedRef = composeRefs<HTMLElement>(triggerRef, (children as ReactElement<ChildProps>).props.ref)
  // eslint-disable-next-line @eslint-react/no-clone-element, react-hooks/refs -- injects hover/focus handlers into the trigger without an extra wrapper span
  const childWithHandlers = cloneElement(children, {
    ref: composedRef,
    /* Pressing a trigger dismisses its tooltip, the way every desktop tooltip behaves: the label
     * has been read, the press is the answer to it, and whatever the press changes is what the eye
     * should be on. It also covers the case above from the other side, before the disable lands. */
    onPointerDown: (e: React.PointerEvent) => { close(); children.props.onPointerDown?.(e) },
    onMouseEnter: (e: React.MouseEvent) => { show(); children.props.onMouseEnter?.(e) },
    onMouseLeave: (e: React.MouseEvent) => { close(); children.props.onMouseLeave?.(e) },
    onFocus:      (e: React.FocusEvent) => { if (lastInputWasKeyboard) { show() } children.props.onFocus?.(e) },
    onBlur:       (e: React.FocusEvent) => { close(); children.props.onBlur?.(e) },
    'aria-describedby': open && position ? id : children.props['aria-describedby'],
  })

  return (
    <>
      {childWithHandlers}
      {/* BOTH, and `open` first. The hook keeps the last position after it
          closes — it has nothing to reset it to and no reason to — so a layer
          that renders on `position` alone opens once and never leaves. Every
          consumer of the hook gates on its own open state; this one learned
          that from four failing tests (2026-08-31). */}
      {open && position && createPortal(
        <div
          id={id}
          role="tooltip"
          className="tooltip"
          ref={(node) => {
            /* The layer's ref belongs to the hook — it is what tells the
               measurement the portal exists and what an outside press is
               measured against. The multiline flag rides along: the pill radius
               looks wrong once the text wraps, so a wrapped tooltip says so and
               the CSS switches to a rect radius. */
            setLayer(node)
            if (!node) return
            const oneLine = parseFloat(getComputedStyle(node).lineHeight) * 1.5
            if (node.getBoundingClientRect().height > oneLine) node.dataset.multiline = 'true'
          }}
          style={{ top: position.top, left: position.left, transform: position.transform }}
        >
          {content}
        </div>,
        document.body,
      )}
    </>
  )
}
