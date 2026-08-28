import { useEffect, type RefObject } from 'react'
import { useLatest } from './useLatest'

/**
 * THE TWO DISMISSALS every transient layer answers to: a press outside it, and
 * Escape. Nothing else — a layer that also closes on scroll, on blur or on a
 * route change is describing its own lifecycle, and that belongs to it.
 *
 * Separated from `useAnchoredLayer` because <ContextMenu> needs exactly this
 * and none of the rest: its position comes from the pointer event that opened
 * it, so there is nothing to measure and nothing to reflow. Passing it a
 * `measure` that returns a stored point would be a no-op pretending to be a
 * measurement (2026-08-26). Sharing this much and no more is the honest amount.
 *
 * `stays` are the elements a press inside must NOT close: the layer itself, and
 * usually the trigger, whose own click handler already toggles it.
 */
export function useDismiss({
  open,
  onClose,
  stays,
}: {
  open: boolean
  onClose: () => void
  stays: RefObject<HTMLElement | null>[]
}) {
  const onCloseRef = useLatest(onClose)
  const staysRef = useLatest(stays)

  useEffect(() => {
    if (!open) return
    const inside = (target: Node) =>
      staysRef.current.some((r) => r.current?.contains(target))
    const onDown = (e: globalThis.MouseEvent) => {
      if (inside(e.target as Node)) return
      onCloseRef.current()
    }
    const onKey = (e: globalThis.KeyboardEvent) => {
      /* preventDefault, so one Escape does not also close a dialog behind this
         layer or leave a native full-screen. Every layer answers the same way. */
      if (e.key === 'Escape') { e.preventDefault(); onCloseRef.current() }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onCloseRef, staysRef])
}
