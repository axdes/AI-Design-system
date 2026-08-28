/* Reference solution — what "used the design system" looks like for this task.
 * Doubles as a regression fixture: the scorers must give it a perfect score. */
import { useState } from 'react'
import { FormStack } from '@/components/FormStack'
import { Modal } from '@/components/Modal'
import { Alert } from '@/components/Alert'
import { Button } from '@/components/Button'
import { Field } from '@/components/Field'
import { Icon } from '@/components/Icon'
import { Input } from '@/components/Input'
import { Select } from '@/components/Select'

type Role = 'editor' | 'viewer' | 'admin'

const ROLES: { value: Role; label: string }[] = [
  { value: 'editor', label: 'Editor' },
  { value: 'viewer', label: 'Viewer' },
  { value: 'admin', label: 'Admin' },
]

export function Screen() {
  const [open, setOpen] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('editor')
  const [error, setError] = useState<string | null>(null)

  const close = () => {
    setOpen(false)
    setError(null)
  }

  const save = () => {
    if (!fullName.trim() || !email.trim()) {
      setError('Full name and email are required.')
      return
    }
    close()
  }

  return (
    <>
      <Button variant="primary" iconEnd onClick={() => setOpen(true)}>
        Invite user<Icon name="person_add" />
      </Button>

      <Modal open={open} title="Invite user" onClose={close} actions={{ onConfirm: save, confirmLabel: 'Send invite' }}>
        <FormStack>
        {error && <Alert tone="danger" role="alert">{error}</Alert>}
        <Field label="Full name" htmlFor="invite-name" required>
          <Input id="invite-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </Field>
        <Field label="Email" htmlFor="invite-email" required>
          <Input id="invite-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Role" htmlFor="invite-role">
          <Select label="Role" value={role} onChange={setRole} options={ROLES} />
        </Field>
        </FormStack>
      </Modal>
    </>
  )
}
