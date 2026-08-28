import './Progress.css'
import { cn } from '../../lib/cn'

type Tone = 'primary' | 'success' | 'warning' | 'danger'
type Size = 'sm' | 'md' | 'lg'

type Props = {
  /** 0..max filled fraction. Omit for an INDETERMINATE bar (unknown duration); a ring has no indeterminate form. */
  value?: number
  max?: number
  /** Linear or a ring. A shape, not a meaning — both say the same thing about the same value. */
  shape?: 'bar' | 'ring'
  tone?: Tone
  /** Ring only: how big the ring is. A bar takes the width it is given. */
  size?: Size
  /** Accessible name of what is progressing. */
  label: string
  /** Show the value — beside the label on a bar, inside the ring. */
  showValue?: boolean
  /** Formats the shown value (default is the rounded percentage). */
  formatValue?: (value: number, max: number) => string
  className?: string
}

const clamp = (n: number) => Math.max(0, Math.min(100, n))

/**
 * How far along something is — as a bar or as a ring.
 *
 * One component, because a bar and a ring are one statement in two shapes:
 * HTML makes the meaningful split elsewhere, between `<progress>` (work moving
 * toward done) and `<meter>` (a value on a scale that does not move), and this
 * system keeps that split as <Progress> and <Meter>. Line versus circle is a
 * choice about the room available, not about what is being said, so it is a
 * prop (2026-08-25; it was two components, and the ring's own description
 * called itself the counterpart of the bar).
 *
 * With `value` it is determinate; without, a bar slides for "working, duration
 * unknown". For a spinning busy marker use <Spinner>; for a gauge with a target
 * use <Meter>.
 *
 * Copy: the label says what is progressing and toward what — "Uploading 3 of 12
 * files". A bare percentage is a number with no subject.
 */
export function Progress({
  value, max = 100, shape = 'bar', tone = 'primary', size, label, showValue, formatValue, className,
}: Props) {
  const indeterminate = value === undefined
  const pct = indeterminate ? 0 : clamp((value / max) * 100)
  const shown = formatValue && !indeterminate ? formatValue(value, max) : `${Math.round(pct)}%`
  const aria = {
    role: 'progressbar' as const,
    'aria-label': label,
    'aria-valuemin': indeterminate ? undefined : 0,
    'aria-valuemax': indeterminate ? undefined : max,
    'aria-valuenow': indeterminate ? undefined : value,
  }

  /* The ring is drawn with pathLength=100 so the dash pattern speaks in percent;
     `--pct` is the only dynamic style either shape carries. */
  if (shape === 'ring') {
    return (
      <div
        className={cn('progress', className)}
        data-shape="ring"
        data-tone={tone}
        data-size={size}
        style={{ ['--pct' as string]: pct }}
        {...aria}
      >
        <svg className="progress-ring" viewBox="0 0 36 36" aria-hidden="true">
          <circle className="progress-ring-track" cx="18" cy="18" r="16" pathLength="100" />
          <circle className="progress-ring-fill" cx="18" cy="18" r="16" pathLength="100" />
        </svg>
        {showValue && <span className="progress-value" aria-hidden="true">{shown}</span>}
      </div>
    )
  }

  return (
    <div className={cn('progress', className)} data-shape="bar">
      <div className="progress-labelrow">
        <span className="progress-label">{label}</span>
        {showValue && !indeterminate && <span className="progress-value" aria-hidden="true">{shown}</span>}
      </div>
      <div
        className="progress-track"
        data-tone={tone}
        data-indeterminate={indeterminate || undefined}
        style={indeterminate ? undefined : { ['--pct' as string]: pct }}
        {...aria}
      >
        <div className="progress-fill" />
      </div>
    </div>
  )
}
