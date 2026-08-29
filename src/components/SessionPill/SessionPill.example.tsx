/* Golden example. The pill is presentational: the app shell renders it once,
 * owns the timer tick and the polling, and hides it on the session's own
 * screen. */
import { SessionPill } from './SessionPill'

/* THE THING STILL RUNNING SOMEWHERE ELSE. A reader who has navigated away needs
 * to know a recording is going, a call is live, a job is finishing — and needs
 * one press back to it. It is not a notification: a notification says something
 * HAPPENED, this says something IS HAPPENING, and it leaves when that stops.
 *
 * `tone` is HOW BAD IT IS TO IGNORE, and it decides whether `onDismiss` is
 * allowed at all. `warning` is a reminder the reader may put away — a wrap-up
 * they will get back to — so it may carry a dismiss. `danger` is a live thing
 * with a cost: a recording running, an emergency call. It gets NO dismiss,
 * because the way to make it go away is to deal with it.
 *
 * `timer` is what makes it believable: a pill that says "recording" with no
 * elapsed time could be stale, and the reader has no way to tell.
 */
export function Example() {
  /* ONE PILL, BECAUSE THERE IS ONLY EVER ONE. It is `position: fixed` at the
     bottom of the viewport: the shell renders it once, and a second one would
     be drawn on top of the first rather than beside it. So this example shows
     the strict case — a live recording, `danger`, and therefore no dismiss.
     The `warning` half of the axis is the same pill with `onDismiss` given. */
  return (
    <SessionPill
      tone="danger"
      label="Recording: Design sprint"
      timer="12:47"
      actionLabel="Back to the board"
      icon="mic"
      onClick={() => undefined}
    />
  )
}
