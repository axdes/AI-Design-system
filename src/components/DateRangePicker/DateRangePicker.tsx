import '../DatePicker/DatePicker.css'
import './DateRangePicker.css'
import { useState } from 'react'
import { cn } from '../../lib/cn'
import { Calendar } from '../Calendar'
import { Icon } from '../Icon'
import { Popover } from '../Popover'

export type DateRange = { start: Date; end: Date }

type Props = {
  value?: DateRange
  /** Fires once both ends are picked, already ordered. */
  onChange: (range: DateRange) => void
  min?: Date
  max?: Date
  /** Accessible name for the trigger. */
  label: string
  placeholder?: string
  /** BCP-47 locale for the shown dates + the calendar. Defaults to document lang. */
  locale?: string
  /** A STATE, not a style: it turns the border and hands <Field> the hook it needs to read the
   *  error out as part of the field.
   */
  invalid?: boolean
  /** Which surface the field sits on; same contract as <DatePicker>. */
  surface?: 'base' | 'muted'
  /** sm / md (default) / lg — matches the shared control height/padding scale. */
  size?: 'sm' | 'md' | 'lg'
  /** Dimmed and unpressable, but pointer events are KEPT so a Tooltip can say why. */
  disabled?: boolean
  className?: string
}

/* A date-span field: one trigger, one <Calendar>, two picks. The first click
 * marks the start, the second closes with the ordered range (picking backwards
 * swaps the ends instead of failing). One date is <DatePicker>; this is the
 * from/to filter over a list or a report. 
   *
   * Copy: the label names the span — "Reporting period" — and never says
   * "from/to", which the two halves already say.
   */
export function DateRangePicker({
  value, onChange, min, max, label, placeholder = 'Select dates',
  locale = typeof document !== 'undefined' ? document.documentElement.lang || 'en' : 'en',
  invalid, disabled, surface = 'base', size, className,
}: Props) {
  const [key, setKey] = useState(0) // remount the Popover to close it on the second pick
  const [pendingStart, setPendingStart] = useState<Date | null>(null)
  const fmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' })
  const shown = value ? `${fmt.format(value.start)} to ${fmt.format(value.end)}` : placeholder

  const pick = (d: Date) => {
    if (!pendingStart) {
      setPendingStart(d)
      return
    }
    const [start, end] = d < pendingStart ? [d, pendingStart] : [pendingStart, d]
    onChange({ start, end })
    setPendingStart(null)
    setKey((k) => k + 1)
  }

  return (
    <Popover
      key={key}
      label={label}
      trigger={(props) => (
        <button
          type="button"
          className={cn('datepicker-trigger', 'daterangepicker-trigger', className)}
          data-invalid={invalid || undefined}
          data-surface={surface}
          data-size={size}
          data-placeholder={!value || undefined}
          disabled={disabled}
          aria-label={label}
          {...props}
        >
          <Icon name="calendar" className="datepicker-icon" />
          <span>{shown}</span>
        </button>
      )}
    >
      <Calendar
        rangeStart={pendingStart ?? value?.start}
        rangeEnd={pendingStart ? undefined : value?.end}
        min={min}
        max={max}
        locale={locale}
        onChange={pick}
      />
    </Popover>
  )
}
