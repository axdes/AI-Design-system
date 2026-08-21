/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { ConfirmDialog } from './ConfirmDialog'
import { Button } from '../../components/Button'

export function Example() {
  /* Open by default so the example shows the dialog itself, the way Modal and
   * FormModal do: a closed dialog documents nothing and leaves the visual
   * baseline watching a button. */
  const [open, setOpen] = useState(true)
  const [busy, setBusy] = useState(false)

  /* A confirm exists to slow down an irreversible action, so the destructive
   * variant and a message that names the consequence are the point, not decoration. */
  const remove = () => {
    setBusy(true)
    setTimeout(() => {
      setBusy(false)
      setOpen(false)
    }, 600)
  }

  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        Delete workshop
      </Button>
      <ConfirmDialog
        open={open}
        title="Delete this workshop?"
        message="The transcript and every card generated from it are removed. This cannot be undone."
        confirmLabel="Delete"
        confirmVariant="destructive"
        busy={busy}
        onConfirm={remove}
        onClose={() => setOpen(false)}
      />
    </>
  )
}
