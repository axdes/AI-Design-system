import './SessionPill.css'
import { type ReactNode } from 'react'
import { Icon, type IconName } from '../Icon'
import { Tooltip } from '../Tooltip'
import { cn } from '../../lib/cn'

/* Monolithic because it is one floating pill that says what is running: the
 * label, the timer, the action back to it and the way to dismiss it. Every
 * prop is one of those four, and none of them is a part. */
type Props = {
  /** What is live ("Emergency call", "Recording: Design sprint"). */
  label: ReactNode
  /** Formatted elapsed time (mm:ss). The app owns the ticking. */
  timer?: string
  /** The return action's words ("Return to call"). */
  actionLabel?: ReactNode
  /** Trailing icon on the action. */
  icon?: IconName
  /** Go back to the session. */
  onClick: () => void
  /**
   * Dismiss — ONLY for a session that may be hidden (a wrap-up reminder, yes;
   * a live emergency call, never). The rule one product set: dismissal is per state, and a
   * state change brings the pill back — the caller owns that comparison.
   */
  onDismiss?: () => void
  dismissLabel?: string
  /** danger = something live is running (default); warning = it ended, work remains. */
  tone?: 'danger' | 'warning'
  className?: string
}

/**
 * The floating "a session is live elsewhere" pill: pulsing dot, what is
 * running, the timer, one press back to it. Rendered once by the app shell so
 * it survives navigation, and hidden on the session's own screen — the two
 * rules both hand-rolled versions (a live-call bar and a
 * RecordingPill) discovered independently. Presentational: state, polling and
 * routing stay in the app.
 *
 * Copy: names what is running, not that something is — "Recording", "Listening".
 */
export function SessionPill({
  label,
  timer,
  actionLabel,
  icon,
  onClick,
  onDismiss,
  dismissLabel = 'Dismiss',
  tone = 'danger',
  className,
}: Props) {
  return (
    <div className={cn('session-pill', className)} data-tone={tone}>
      <button type="button" className="session-pill-main" onClick={onClick}>
        <span className="session-pill-dot" aria-hidden="true" />
        <span className="session-pill-label">{label}</span>
        {timer && <span className="session-pill-timer">{timer}</span>}
        {actionLabel && (
          <span className="session-pill-action">
            {actionLabel}
            {icon && <Icon name={icon} />}
          </span>
        )}
      </button>
      {onDismiss && (
        <Tooltip content={dismissLabel}>
          <button type="button" className="session-pill-dismiss" aria-label={dismissLabel} onClick={onDismiss}>
            <Icon name="close" />
          </button>
        </Tooltip>
      )}
    </div>
  )
}
