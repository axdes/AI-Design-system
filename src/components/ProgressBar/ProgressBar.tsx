import './ProgressBar.css'
import { cn } from '../../lib/cn'

type Tone = 'primary' | 'success' | 'warning' | 'danger'

type Props = {
  /** 0..max filled fraction. Omit for an INDETERMINATE bar (unknown duration). */
  value?: number
  max?: number
  tone?: Tone
  /** Accessible name of what is progressing. */
  label: string
  /** Show the percentage at the inline-end of the label row. */
  showValue?: boolean
  className?: string
}

/* Linear progress, the bar that says how far along something is. With `value` it is determinate (a known fraction, ARIA
 * progressbar with valuenow); without, it is indeterminate — a sliding bar for
 * "working, duration unknown". For a spinning busy marker use <Spinner>; for a
 * value on a fixed scale (a gauge with a target) use <Meter>. */
export function ProgressBar({ value, max = 100, tone = 'primary', label, showValue, className }: Props) {
  const indeterminate = value === undefined
  const pct = indeterminate ? 0 : Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div className={cn('progressbar', className)}>
      {(showValue || label) && (
        <div className="progressbar-labelrow">
          <span className="progressbar-label">{label}</span>
          {showValue && !indeterminate && <span className="progressbar-value" aria-hidden="true">{Math.round(pct)}%</span>}
        </div>
      )}
      <div
        className="progressbar-track"
        role="progressbar"
        aria-label={label}
        aria-valuemin={indeterminate ? undefined : 0}
        aria-valuemax={indeterminate ? undefined : max}
        aria-valuenow={indeterminate ? undefined : value}
        data-tone={tone}
        data-indeterminate={indeterminate || undefined}
      >
        <div className="progressbar-fill" style={indeterminate ? undefined : { inlineSize: `${pct}%` }} />
      </div>
    </div>
  )
}
