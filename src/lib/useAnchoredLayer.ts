import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useDismiss } from './useDismiss'
import { useLatest } from './useLatest'

/**
 * THE FLOATING-LAYER MECHANISM: a layer anchored to a trigger, kept in place
 * while the page moves, and dismissed the two ways every such layer is.
 *
 * It exists because <Dropdown> and <Popover> each wrote it, and writing it
 * twice is how the two drifted (2026-08-26): Dropdown throttled its reflow with
 * requestAnimationFrame and listened passively, Popover repositioned
 * synchronously on every scroll event. One of the two was simply worse and
 * nothing said so — which is the failure mode a shared mechanism prevents and a
 * shared *component* would not have, since these two are not one component.
 *
 * GEOMETRY IS NOT HERE. The caller passes `measure`, because where a menu wants
 * to sit and where a dialog wants to sit are different questions; the listeners,
 * the throttling, the mount timing and the dismissal are the same question.
 * `lib/placement.ts` is the arithmetic, shared and tested separately.
 */
export function useAnchoredLayer<P>({
  open,
  onClose,
  measure,
  dismissible = true,
}: {
  open: boolean
  /** Called on an outside press or Escape. Ignored when `dismissible` is false. */
  onClose: () => void
  /** Where the layer goes, in viewport coordinates. Read the refs below. */
  measure: () => P | null
  dismissible?: boolean
}) {
  const triggerRef = useRef<HTMLElement | null>(null)
  const layerRef = useRef<HTMLElement | null>(null)
  const [position, setPosition] = useState<P | null>(null)
  /* The layer is portalled and mounts a tick after `open`, so its real size does
   * not exist yet on the first pass. A mount flag re-runs the measurement once
   * it does; a ref callback alone would re-run on every render and loop. */
  const [mounted, setMounted] = useState(false)

  const measureRef = useLatest(measure)

  const setLayer = useCallback((node: HTMLElement | null) => {
    layerRef.current = node
    setMounted(Boolean(node))
  }, [])

  useLayoutEffect(() => {
    if (!open) return
    // eslint-disable-next-line @eslint-react/set-state-in-effect -- positions a portal from measured geometry; not derivable during render
    setPosition(measureRef.current())
  }, [open, mounted, measureRef])

  /* Reflow while open: rAF-throttled and passive, so a scroll stays a scroll. */
  useEffect(() => {
    if (!open) return
    let raf = 0
    const update = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setPosition(measureRef.current()))
    }
    window.addEventListener('scroll', update, { capture: true, passive: true })
    window.addEventListener('resize', update, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [open, measureRef])

  /* The two dismissals are `useDismiss`'s: <ContextMenu> needs them without any
     of the measuring above, so they are their own hook. */
  useDismiss({ open: open && dismissible, onClose, stays: [triggerRef, layerRef] })

  /* `mounted` is returned because a caller may have its own work that can only
     run once the layer's DOM exists — Dropdown caches its menu items and moves
     focus to the first one. */
  return { triggerRef, layerRef, setLayer, position, mounted }
}
