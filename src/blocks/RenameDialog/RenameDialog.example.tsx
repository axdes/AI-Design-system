/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { Button } from '../../components/Button'
import { RenameDialog } from './RenameDialog'

export function Example() {
  const [open, setOpen] = useState(false)
  /* The name lives with the row: `initial` seeds the field, `onSave` fires only
   * when the user actually changed it. */
  const [name, setName] = useState('Kickoff call')

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>Rename</Button>
      <RenameDialog
        open={open}
        title="Rename recording"
        label="Name"
        initial={name}
        onClose={() => setOpen(false)}
        onSave={(next) => { setName(next); setOpen(false) }}
      />
    </>
  )
}
