import './Slider.css'
import { useId, type InputHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange' | 'min' | 'max' | 'step'> & {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  /** Accessible name. */
  label: string
  /** Show the current value at the inline-end of the label row. */
  showValue?: boolean
  /** Formats the shown value (e.g. `(v) => `${v}%``). Default is the raw number. */
  formatValue?: (value: number) => string
}

/* Single-value range input. Built on the native <input type="range">, so the
 * keyboard contract (arrows, Home/End, Page Up/Down) and screen-reader support
 * come for free; this adds the label row, the value read-out and the themed
 * track. The filled portion is driven by a --pct custom property. 
   *
   * Copy: the label carries the unit; the value is announced as the reader would
   * say it, not as a raw number.
   */
export function Slider({
  value, onChange, min = 0, max = 100, step = 1, label, showValue, formatValue, className, disabled, ...rest
}: Props) {
  const id = useId()
  const pct = max === min ? 0 : ((value - min) / (max - min)) * 100
  const shown = formatValue ? formatValue(value) : String(value)

  return (
    <div className={cn('slider', className)} data-disabled={disabled || undefined}>
      <div className="slider-labelrow">
        <label className="slider-label" htmlFor={id}>{label}</label>
        {showValue && <span className="slider-value" aria-hidden="true">{shown}</span>}
      </div>
      <input
        id={id}
        type="range"
        className="slider-input"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        /* No `aria-label`: the visible <label> above already names this input,
           and an aria-label OVERRIDES it. Two names for one control are the same
           name only until one of them changes, and the one people hear would be
           the one nobody can see (WCAG 2.5.3, Label in Name). Removed 2026-08-26
           after a mutation test showed deleting it changed nothing. */
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ ['--pct' as string]: `${pct}%` }}
        {...rest}
      />
    </div>
  )
}
