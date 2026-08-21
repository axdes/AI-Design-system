/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { FeedbackModal } from './FeedbackModal'

export function Example() {
  const [open, setOpen] = useState(true)

  /* Every string comes from the caller: the component stays i18n-agnostic, so
   * the app passes already-translated copy (t('...')) into `labels`. */
  return (
    <FeedbackModal
      open={open}
      onClose={() => setOpen(false)}
      onSubmit={() => setOpen(false)}
      labels={{
        title: 'What went wrong?',
        close: 'Close',
        send: 'Send feedback',
        desc: 'Tell us what the answer got wrong so we can fix it.',
        detailsLabel: 'Details',
        detailsPlaceholder: 'What did you expect to see?',
        reasons: {
          wrong: 'Wrong answer',
          incomplete: 'Incomplete',
          unclear: 'Unclear',
          other: 'Something else',
        },
      }}
    />
  )
}
