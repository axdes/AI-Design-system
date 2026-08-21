import './Time.css'
import { useEffect, useState } from 'react'
import { cn } from '../../lib/cn'
import { relativeLabel } from '../../lib/relativeTime'

type Mode = 'auto' | 'relative' | 'absolute'

type Props = {
  /** ISO string, epoch milliseconds, or a Date. */
  value: string | number | Date
  /** `auto` (default) reads relative under a week and absolute after, which is
   *  what a notification list, a feed and a comment thread all want. */
  mode?: Mode
  /** BCP-47 tag. Omit to follow the browser. */
  locale?: string
  className?: string
}

const WEEK = 7 * 24 * 60 * 60 * 1000
const HOUR = 60 * 60 * 1000

/** A timestamp said the way a reader says it, with the exact one underneath.
 *
 *  The relative label is never the only copy of the fact: `dateTime` carries the
 *  machine-readable instant and `title` the full local date, so "2 hours ago" is
 *  hoverable and parseable rather than the only thing on the page. */
export function Time({ value, mode = 'auto', locale, className }: Props) {
  const ts = new Date(value).getTime()
  /* Lazily, so render stays pure; the effect below keeps it honest afterwards. */
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (mode === 'absolute' || Number.isNaN(ts)) return
    let id = 0
    const tick = () => {
      setNow(Date.now())
      /* A minute-old message needs a new label twice a minute; a three-day-old
       * one does not. Reschedule from the age rather than polling everything on
       * the page at the same rate. */
      id = window.setTimeout(tick, Date.now() - ts < HOUR ? 30_000 : 24 * HOUR)
    }
    id = window.setTimeout(tick, 30_000)
    return () => { window.clearTimeout(id) }
  }, [mode, ts])

  /* An unparseable date is a data bug, not a rendering one. Printing what was
   * passed makes it visible; printing "Invalid Date" or nothing hides it. */
  if (Number.isNaN(ts)) return <span className={cn('time', className)}>{String(value)}</span>

  const iso = new Date(ts).toISOString()
  const absolute = new Date(ts).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })
  const relative = relativeLabel(ts, now, locale)
  const useRelative = mode === 'relative' || (mode === 'auto' && Math.abs(now - ts) < WEEK)

  return (
    <time className={cn('time', className)} dateTime={iso} title={absolute}>
      {useRelative ? relative : absolute}
    </time>
  )
}
