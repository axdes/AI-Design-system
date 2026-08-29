import './DatePicker.css'
import { useState } from 'react'
import { cn } from '../../lib/cn'
import { Calendar } from '../Calendar'
import { Icon } from '../Icon'
import { Popover } from '../Popover'

type Props = {
  value?: Date
  onChange: (date: Date) => void
  min?: Date
  max?: Date
  /** Accessible name for the trigger. */
  label: string
  /** Lands on the trigger, so `<Field htmlFor>` reaches it and an `ErrorSummary`
   *  row can put focus on it (see Select — same gap, same day). */
  id?: string
  placeholder?: string
  /** BCP-47 locale for the shown date + the calendar. Defaults to document lang. */
  locale?: string
  /** A STATE, not a style: it turns the border and hands <Field> the hook it needs to read the
   *  error out as part of the field.
   */
  invalid?: boolean
  /** Which surface the field sits on. On `muted` (a page/PageHeader) the border
   *  is dropped since the white fill separates it; `base` (default, a white card
   *  or form) keeps the border. Invalid + focus stay visible on both. */
  surface?: 'base' | 'muted'
  /** sm / md (default) / lg — matches the shared control height/padding scale. */
  size?: 'sm' | 'md' | 'lg'
  /** Dimmed and unpressable, but pointer events are KEPT so a Tooltip can say why. A control the
   *  reader cannot use and cannot ask about is a dead end.
   */
  disabled?: boolean
  className?: string
}

/* A date field: a trigger that reads like an input and opens a <Calendar> in a
 * <Popover>. Picking a day sets the value and closes. The shown date is
 * formatted with Intl; the calendar carries the keyboard contract. 
   *
   * Copy: the label names the event, not the field — "Delivery date". The
   * placeholder shows the format the reader may type, and it is the format
   * their locale writes.
   */
export function DatePicker({
  value, onChange, min, max, label, id, placeholder = 'Select date',
  locale = typeof document !== 'undefined' ? document.documentElement.lang || 'en' : 'en',
  invalid, disabled, surface = 'base', size, className,
}: Props) {
  const [key, setKey] = useState(0) // remount the Popover to close it on pick
  const fmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' })
  const shown = value ? fmt.format(value) : placeholder

  return (
    <Popover
      key={key}
      label={label}
      trigger={(props) => (
        <button
          type="button"
          id={id}
          className={cn('datepicker-trigger', className)}
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
        value={value}
        min={min}
        max={max}
        locale={locale}
        onChange={(d) => { onChange(d); setKey((k) => k + 1) }}
      />
    </Popover>
  )
}
