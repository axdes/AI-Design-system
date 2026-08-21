import './ProgressCircle.css'
import { cn } from '../../lib/cn'

type Tone = 'primary' | 'success' | 'warning' | 'danger'
type Size = 'sm' | 'md' | 'lg'

type Props = {
  value: number
  /** Scale maximum (default 100). */
  max?: number
  tone?: Tone
  size?: Size
  /** Show the value in the middle of the ring. */
  showValue?: boolean
  /** Formats the shown value (default is the rounded percentage). */
  formatValue?: (value: number, max: number) => string
  /** Accessible description of what the ring measures. */
  label?: string
  className?: string
}

const clamp = (n: number) => Math.max(0, Math.min(100, n))

/* Progress as a ring: the compact dashboard counterpart to <ProgressBar>
 * (linear, ongoing work) and <Meter> (linear, fixed scale). The circle is
 * drawn with pathLength=100 so the dash pattern speaks in percent; --pct is
 * the only dynamic style. */
export function ProgressCircle({ value, max = 100, tone = 'primary', size, showValue, formatValue, label, className }: Props) {
  const pct = clamp((value / max) * 100)
  const shown = formatValue ? formatValue(value, max) : `${Math.round(pct)}%`

  return (
    <div
      className={cn('progresscircle', className)}
      data-tone={tone}
      data-size={size}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      style={{ ['--pct' as string]: pct }}
    >
      <svg className="progresscircle-svg" viewBox="0 0 36 36" aria-hidden="true">
        <circle className="progresscircle-track" cx="18" cy="18" r="16" pathLength="100" />
        <circle className="progresscircle-fill" cx="18" cy="18" r="16" pathLength="100" />
      </svg>
      {showValue && <span className="progresscircle-value" aria-hidden="true">{shown}</span>}
    </div>
  )
}
