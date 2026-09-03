import { useCallback, useEffect, useRef } from 'react'

/**
 * ONE PENDING TIMEOUT, cleared before the next one and on unmount.
 *
 * Every layer that opens on hover needs exactly this and both of them wrote it:
 * <Tooltip> waits out its delay before appearing, <HoverCard> waits before
 * appearing and again before closing so the pointer can travel onto the card.
 * Six lines each, and the sixth is the one that matters — clearing the pending
 * timer when the component goes away, without which a hover that ends in a
 * navigation sets state on something that is no longer there.
 *
 * Not a hover mechanism: a hover mechanism would have to decide what "intent"
 * means, and the two callers mean different things by it. This owns the timer
 * and nothing else, which is the part they actually shared. (2026-09-03)
 */
export function useTimer() {
  const timer = useRef<number | null>(null)

  const cancel = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
  }, [])

  /** Run `fn` after `ms`, replacing whatever was pending. */
  const after = useCallback((ms: number, fn: () => void) => {
    cancel()
    timer.current = window.setTimeout(() => {
      timer.current = null
      fn()
    }, ms)
  }, [cancel])

  useEffect(() => cancel, [cancel])

  return { after, cancel }
}
