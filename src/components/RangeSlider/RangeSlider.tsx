import './RangeSlider.css'
import { useId } from 'react'
import { cn } from '../../lib/cn'

type Props = {
  /** The selected span, start then end. */
  value: [number, number]
  onChange: (value: [number, number]) => void
  min?: number
  max?: number
  step?: number
  /** Accessible name; each thumb announces it plus "start" / "end". */
  label: string
  /** Show the current span at the inline-end of the label row. */
  showValue?: boolean
  /** Formats one bound of the shown span (e.g. `(v) => `${v}%``). */
  formatValue?: (value: number) => string
  disabled?: boolean
  className?: string
}

/* A bounded pair on one track: a price between two values, any filter with a
 * "from" and a "to" on the same scale. Two native range inputs share the
 * track, so the keyboard contract comes for free; each thumb clamps against
 * the other instead of crossing it. Single value? That is <Slider>. */
export function RangeSlider({
  value, onChange, min = 0, max = 100, step = 1, label, showValue, formatValue, disabled, className,
}: Props) {
  const id = useId()
  const [start, end] = value
  const fmt = (v: number) => (formatValue ? formatValue(v) : String(v))
  const span = max - min
  const pctStart = span === 0 ? 0 : ((start - min) / span) * 100
  const pctEnd = span === 0 ? 0 : ((end - min) / span) * 100

  return (
    <div className={cn('rangeslider', className)} data-disabled={disabled || undefined}>
      <div className="rangeslider-labelrow">
        <label className="rangeslider-label" htmlFor={id}>{label}</label>
        {showValue && (
          <span className="rangeslider-value" aria-hidden="true">
            {fmt(start)} to {fmt(end)}
          </span>
        )}
      </div>
      <div className="rangeslider-track">
        <div className="rangeslider-rail" />
        <div
          className="rangeslider-fill"
          style={{ insetInlineStart: `${pctStart}%`, inlineSize: `${pctEnd - pctStart}%` }}
        />
        <input
          id={id}
          type="range"
          className="rangeslider-input"
          min={min}
          max={max}
          step={step}
          value={start}
          disabled={disabled}
          aria-label={`${label} start`}
          /* When both thumbs sit in the upper half the start input renders on
           * top, so a pair collapsed at the maximum can still be pulled apart. */
          data-top={start > (min + max) / 2 || undefined}
          onChange={(e) => onChange([Math.min(Number(e.target.value), end), end])}
        />
        <input
          type="range"
          className="rangeslider-input"
          min={min}
          max={max}
          step={step}
          value={end}
          disabled={disabled}
          aria-label={`${label} end`}
          onChange={(e) => onChange([start, Math.max(Number(e.target.value), start)])}
        />
      </div>
    </div>
  )
}
