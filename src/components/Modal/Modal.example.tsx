/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { Modal } from './Modal'
import { Button } from '../Button'
import { Field } from '../Field'
import { FormStack } from '../FormStack'
import { Input } from '../Input'

/* ONE dialog, any content. `actions` is the decision the dialog asks for, and
 * it owns the order — cancel a ghost on the leading side, confirm trailing — so
 * no screen re-decides it. A form is this with a <FormStack> of Fields inside;
 * a confirmation is the same dialog at `size="sm"` with a sentence inside and
 * `tone="destructive"` on the commitment.
 *
 * Consumer owns `open`; kept true here so the example renders the dialog. */
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
        actions={{ confirmLabel: 'Save', onConfirm: () => setOpen(false) }}
      >
        <FormStack>
          <Field label="Full name" htmlFor="modal-example-name">
            <Input id="modal-example-name" autoComplete="name" defaultValue="Ada Meridian" data-autofocus />
          </Field>
          <Field label="Email" htmlFor="modal-example-email">
            <Input id="modal-example-email" type="email" autoComplete="email" defaultValue="ada@example.com" />
          </Field>
        </FormStack>
      </Modal>
    </>
  )
}
