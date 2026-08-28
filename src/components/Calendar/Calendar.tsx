import './Calendar.css'
import { useState, type KeyboardEvent } from 'react'
import { cn } from '../../lib/cn'
import { IconButton } from '../IconButton'
import { Tooltip } from '../Tooltip'

type Props = {
  /** Currently selected day. */
  value?: Date
  onChange: (date: Date) => void
  /** Controlled visible month; omit to let the calendar manage it. */
  month?: Date
  onMonthChange?: (month: Date) => void
  /** Selectable range bounds (inclusive). */
  min?: Date
  max?: Date
  /** Display a picked span (a DateRangePicker's selection): the edges read as
   *  selected and the days between get a soft band. Display only; clicks still
   *  report through onChange. */
  rangeStart?: Date
  rangeEnd?: Date
  /** 0 = Sunday, 1 = Monday (default). */
  weekStartsOn?: 0 | 1
  /** BCP-47 locale for month/weekday names. Defaults to the document language. */
  locale?: string
  /** Accessible name for the grid. */
  label?: string
  className?: string
}

const DAY = 24 * 60 * 60 * 1000
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1)

/* A month grid for picking a single date. Keyboard: Arrow keys move day, Page
 * Up/Down move month, Home/End jump to the week's start/end, Enter/Space select.
 * Month and weekday names come from Intl (locale + RTL aware). Standalone, or
 * the body of <DatePicker>. 
   *
   * Copy: the accessible name says what the date is FOR — "Delivery date", not
   * "Calendar".
   */
export function Calendar({
  value, onChange, month, onMonthChange, min, max, rangeStart, rangeEnd, weekStartsOn = 1,
  locale = typeof document !== 'undefined' ? document.documentElement.lang || 'en' : 'en',
  label = 'Choose date', className,
}: Props) {
  const [innerMonth, setInnerMonth] = useState(() => startOfDay(value ?? new Date()))
  const view = month ?? innerMonth
  const setView = (m: Date) => { onMonthChange?.(m); if (!month) setInnerMonth(m) }
  const [focusDay, setFocusDay] = useState<Date>(() => startOfDay(value ?? new Date()))

  const monthFmt = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' })
  const weekdayFmt = new Intl.DateTimeFormat(locale, { weekday: 'short' })
  const dayLabelFmt = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const first = new Date(view.getFullYear(), view.getMonth(), 1)
  const lead = (first.getDay() - weekStartsOn + 7) % 7
  const gridStart = new Date(first.getFullYear(), first.getMonth(), 1 - lead)
  const days = Array.from({ length: 42 }, (_, i) => new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i))
  /* Six week-rows: the ARIA grid needs grid > row > gridcell. */
  const weeks = Array.from({ length: 6 }, (_, w) => days.slice(w * 7, w * 7 + 7))
  const weekdays = Array.from({ length: 7 }, (_, i) => weekdayFmt.format(new Date(2023, 0, 1 + ((weekStartsOn + i) % 7))))

  const disabled = (d: Date) => (min && d < startOfDay(min)) || (max && d > startOfDay(max))
  const select = (d: Date) => { if (!disabled(d)) { onChange(d); setFocusDay(d) } }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 7, ArrowUp: -7 }
    if (e.key in moves) {
      e.preventDefault()
      const next = new Date(focusDay.getTime() + moves[e.key] * DAY)
      setFocusDay(next)
      if (next.getMonth() !== view.getMonth()) setView(new Date(next.getFullYear(), next.getMonth(), 1))
    } else if (e.key === 'PageUp') { e.preventDefault(); const m = addMonths(view, -1); setView(m); setFocusDay(new Date(m.getFullYear(), m.getMonth(), Math.min(focusDay.getDate(), 28))) }
    else if (e.key === 'PageDown') { e.preventDefault(); const m = addMonths(view, 1); setView(m); setFocusDay(new Date(m.getFullYear(), m.getMonth(), Math.min(focusDay.getDate(), 28))) }
    else if (e.key === 'Home') { e.preventDefault(); setFocusDay(new Date(focusDay.getTime() - (((focusDay.getDay() - weekStartsOn + 7) % 7)) * DAY)) }
    else if (e.key === 'End') { e.preventDefault(); setFocusDay(new Date(focusDay.getTime() + (6 - ((focusDay.getDay() - weekStartsOn + 7) % 7)) * DAY)) }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(focusDay) }
  }

  const today = startOfDay(new Date())
  const rs = rangeStart ? startOfDay(rangeStart) : null
  const re = rangeEnd ? startOfDay(rangeEnd) : null

  return (
    <div className={cn('calendar', className)}>
      <div className="calendar-head">
        <Tooltip content="Previous month">
          <IconButton icon="chevron_left" size="sm" variant="quiet" aria-label="Previous month" onClick={() => setView(addMonths(view, -1))} />
        </Tooltip>
        <span className="calendar-title" aria-live="polite">{monthFmt.format(view)}</span>
        <Tooltip content="Next month">
          <IconButton icon="chevron_right" size="sm" variant="quiet" aria-label="Next month" onClick={() => setView(addMonths(view, 1))} />
        </Tooltip>
      </div>

      <div className="calendar-weekdays" aria-hidden="true">
        {weekdays.map((w) => <span key={w} className="calendar-weekday">{w}</span>)}
      </div>

      {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus -- the grid delegates focus (roving tabindex) to its day cells */}
      <div className="calendar-grid" role="grid" aria-label={label} onKeyDown={onKeyDown}>
        {weeks.map((week) => (
          <div className="calendar-week" role="row" key={week[0].toISOString()}>
            {week.map((d) => {
              const outside = d.getMonth() !== view.getMonth()
              const rangeEdge = (rs ? sameDay(d, rs) : false) || (re ? sameDay(d, re) : false)
              const inRange = rs && re ? d >= rs && d <= re && !rangeEdge : false
              const selected = (value ? sameDay(d, value) : false) || rangeEdge
              const isFocus = sameDay(d, focusDay)
              return (
                <button
                  key={d.toISOString()}
                  type="button"
                  role="gridcell"
                  className="calendar-day"
                  data-outside={outside || undefined}
                  data-selected={selected || undefined}
                  data-inrange={inRange || undefined}
                  data-today={sameDay(d, today) || undefined}
                  aria-selected={selected}
                  aria-label={dayLabelFmt.format(d)}
                  disabled={disabled(d)}
                  tabIndex={isFocus ? 0 : -1}
                  onClick={() => select(d)}
                >
                  {d.getDate()}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
