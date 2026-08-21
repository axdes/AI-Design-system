import { type ReactNode } from 'react'
import { Button } from '../../components/Button'
import { FormStack } from '../../components/FormStack'
import { Modal } from '../../components/Modal'

type Props = {
  open: boolean
  title: string
  /** The Field rows the caller supplies. */
  children: ReactNode
  confirmLabel?: ReactNode
  cancelLabel?: ReactNode
  onConfirm: () => void
  onClose: () => void
  busy?: boolean
}

/**
 * Recurring pattern: a Modal wrapping a FormStack of Fields with cancel/confirm
 * actions. The shape behind RenameModal and create/edit dialogs across projects.
 */
export function FormModal({
  open,
  title,
  children,
  confirmLabel = 'Save',
  cancelLabel = 'Cancel',
  onConfirm,
  onClose,
  busy,
}: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button onClick={onConfirm} disabled={busy}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <FormStack>{children}</FormStack>
    </Modal>
  )
}
