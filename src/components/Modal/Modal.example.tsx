/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { Modal } from './Modal'
import { Button } from '../Button'

/* Consumer owns `open`; kept true here so the example renders the dialog. */
export function Example() {
  const [open, setOpen] = useState(true)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Edit profile</Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Edit profile"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => setOpen(false)}>Save</Button>
          </>
        }
      >
        <p>Update your name and contact details.</p>
      </Modal>
    </>
  )
}
