import './Carousel.css'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/cn'
import { useLatest } from '../../lib/useLatest'
import { useMediaQuery } from '../../lib/useMediaQuery'
import { IconButton } from '../IconButton'
import { Tooltip } from '../Tooltip'

export type CarouselItem = {
  id: string
  content: ReactNode
}

type Props = {
  items: CarouselItem[]
  /** What the whole carousel is, e.g. "Customer stories". */
  label: string
  /** Milliseconds between slides. Off by default, and ignored entirely under
   *  prefers-reduced-motion; pauses while the pointer or the keyboard is inside. */
  autoPlay?: number
  className?: string
}

/** A slideshow that scrolls rather than animates.
 *
 *  The track is a scroll-snap container, so the browser owns the movement: swipe,
 *  trackpad, shift-wheel and the arrow buttons all end up at the same snap point,
 *  and the whole thing still works with JavaScript busy. The buttons and the dots
 *  are the accessible half; scroll position is the source of truth for which
 *  slide is current, which is why the dots follow a swipe and not only a click. 
 *
 * Copy: the accessible name says what is being scrolled through — "Customer
 * stories", not "Carousel".
 */
export function Carousel({ items, label, autoPlay, className }: Props) {
  const { t } = useTranslation()
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)')

  const goTo = (i: number) => {
    const vp = viewportRef.current
    const next = ((i % items.length) + items.length) % items.length
    setActive(next)
    const slide = vp?.children[next]
    /* scrollTo is missing in jsdom and in a few embedded browsers; the state is
     * already correct, only the movement is skipped. */
    if (!vp || !(slide instanceof HTMLElement) || typeof vp.scrollTo !== 'function') return
    vp.scrollTo({ left: slide.offsetLeft - vp.offsetLeft, behavior: reduced ? 'auto' : 'smooth' })
  }
  /* The interval outlives the render that created it, so it reads the current
   * slide and the current mover through refs: listing them as dependencies would
   * restart the timer on every scroll event instead of every slide. */
  const goToRef = useLatest(goTo)
  const activeRef = useLatest(active)

  useEffect(() => {
    if (!autoPlay || reduced || paused) return
    const id = window.setInterval(() => { goToRef.current(activeRef.current + 1) }, autoPlay)
    return () => { window.clearInterval(id) }
  }, [autoPlay, reduced, paused, goToRef, activeRef])

  /* Which slide is current comes from where the track actually is, so a swipe
   * moves the dots too. Round rather than floor: half a slide across is the next
   * one, and floor left the dot a step behind for the whole gesture. */
  const handleScroll = () => {
    const vp = viewportRef.current
    if (!vp?.clientWidth) return
    const i = Math.round(Math.abs(vp.scrollLeft) / vp.clientWidth)
    setActive(Math.max(0, Math.min(items.length - 1, i)))
  }

  if (items.length === 0) return null

  return (
    <section
      className={cn('carousel', className)}
      aria-roledescription="carousel"
      aria-label={label}
      onMouseEnter={() => { setPaused(true) }}
      onMouseLeave={() => { setPaused(false) }}
      onFocus={() => { setPaused(true) }}
      onBlur={() => { setPaused(false) }}
    >
      {/* Focusable because it scrolls: a region a mouse can drag has to be
        * reachable by keyboard, and arrow keys then move it natively (axe:
        * scrollable-region-focusable). jsx-a11y cannot tell that this div
        * scrolls and asks for an interactive role, which would be a lie; the
        * <section aria-label> above already names the region. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
      <div className="carousel-viewport" ref={viewportRef} tabIndex={0} onScroll={handleScroll}>
        {items.map((item, i) => (
          <div
            key={item.id}
            className="carousel-slide"
            role="group"
            aria-roledescription="slide"
            aria-label={`${String(i + 1)} / ${String(items.length)}`}
            data-active={i === active || undefined}
          >
            {item.content}
          </div>
        ))}
      </div>
      <div className="carousel-controls">
        <Tooltip content={t('a11y.back')}>
          <IconButton icon="chevron_left" aria-label={t('a11y.back')} onClick={() => { goTo(active - 1) }} />
        </Tooltip>
        <div className="carousel-dots">
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              className="carousel-dot"
              aria-label={`${label}, ${String(i + 1)} / ${String(items.length)}`}
              aria-current={i === active || undefined}
              onClick={() => { goTo(i) }}
            />
          ))}
        </div>
        <Tooltip content={t('a11y.next')}>
          <IconButton icon="chevron_right" aria-label={t('a11y.next')} onClick={() => { goTo(active + 1) }} />
        </Tooltip>
      </div>
    </section>
  )
}
