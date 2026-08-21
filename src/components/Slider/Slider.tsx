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
 * track. The filled portion is driven by a --pct custom property. */
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
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ ['--pct' as string]: `${pct}%` }}
        {...rest}
      />
    </div>
  )
}
