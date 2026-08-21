import './LoadMore.css'
import { useEffect, useRef } from 'react'
import { useLatest } from '../../lib/useLatest'
import { cn } from '../../lib/cn'
import { Button } from '../Button'

type Props = {
  /** Fetch the next page. Called once per intersection while `auto`. */
  onLoad: () => void
  loading?: boolean
  /** Renders nothing when false — the end of a list needs no control. */
  hasMore: boolean
  label: string
  loadingLabel?: string
  /** Also fire when the control scrolls into view. The button stays either way:
   *  an infinite list with no control is unreachable from the keyboard and
   *  unusable to anyone who wants the footer. */
  auto?: boolean
  className?: string
}

/** The end of a list that has more of it. `<Pagination>` pages a known total;
 *  this is for the ones where the total is not known and may not be finite. */
export function LoadMore({ onLoad, loading, hasMore, label, loadingLabel, auto, className }: Props) {
  const anchorRef = useRef<HTMLDivElement | null>(null)
  const loadRef = useLatest(onLoad)
  const blockedRef = useLatest(Boolean(loading) || !hasMore)

  useEffect(() => {
    const el = anchorRef.current
    /* jsdom and older browsers have no observer; the button already covers it. */
    if (!auto || !el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver((entries) => {
      /* Guard on a ref, not on the closed-over props: the observer outlives the
       * render it was created in, and firing again mid-fetch is how a feed asks
       * for page 2 four times. */
      if (entries.some((e) => e.isIntersecting) && !blockedRef.current) loadRef.current()
    })
    io.observe(el)
    return () => { io.disconnect() }
  }, [auto, loadRef, blockedRef])

  if (!hasMore) return null

  return (
    <div ref={anchorRef} className={cn('load-more', className)}>
      <Button variant="secondary" onClick={onLoad} loading={loading} loadingLabel={loadingLabel ?? label}>
        {label}
      </Button>
    </div>
  )
}
