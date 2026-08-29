/* Golden example. The caller persists the dismissal; a dismissed guide never
 * returns. */
import { useState } from 'react'
import { Button } from '../Button'
import { SetupGuide } from './SetupGuide'

/* FIRST-RUN AND STEADY-STATE ARE ONE PAGE. The guide sits on top of the real
 * screen and retires step by step, so nobody is held in a separate onboarding
 * that has to hand them over at the end. A wizard on its own route makes the
 * first day and every day after it two different products.
 *
 * `done` COMES FROM THE WORLD, NOT FROM A CLICK. A step is finished because the
 * data source is connected, not because somebody pressed something — so a
 * reader who did the work elsewhere finds it already ticked, and one who
 * pressed the button but failed does not.
 *
 * `onDismiss` APPEARS ONLY WHEN EVERY STEP IS DONE, which is the decision that
 * makes this different from a banner. A guide the reader can close on the first
 * day is a guide they close on the first day, and the setup never happens.
 *
 * `action` is the shortest route to finishing the step, put where the step is
 * named. `detail` says what stays broken until it is done — "reports stay
 * empty" is a reason; "recommended" is not.
 */
export function Example() {
  const [connected, setConnected] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return <p>The guide is gone for good — the page is all work now.</p>
  return (
    <SetupGuide
      title="Get set up"
      onDismiss={() => setDismissed(true)}
      steps={[
        { id: 'workspace', label: 'Name your workspace', done: true },
        {
          id: 'connect',
          label: 'Connect the data source',
          detail: 'Reports stay empty until one is connected.',
          done: connected,
          action: (
            <Button size="sm" variant="secondary" onClick={() => setConnected(true)}>
              Connect
            </Button>
          ),
        },
      ]}
    />
  )
}
