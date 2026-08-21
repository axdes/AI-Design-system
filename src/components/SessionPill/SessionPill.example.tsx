/* Golden example. The pill is presentational: the app shell renders it once,
 * owns the timer tick and the polling, and hides it on the session's own
 * screen. Dismiss appears only for a hideable state (a wrap-up reminder) —
 * a live emergency call gets no dismiss at all. */
import { SessionPill } from './SessionPill'

export function Example() {
  return (
    <SessionPill
      label="Recording: Design sprint"
      timer="12:47"
      actionLabel="Back to the board"
      icon="mic"
      onClick={() => undefined}
    />
  )
}
