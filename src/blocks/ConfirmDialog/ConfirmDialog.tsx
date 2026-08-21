import { type ReactNode } from 'react'
import { Button } from '../../components/Button'
import { Modal } from '../../components/Modal'

type Props = {
  open: boolean
  title: string
  /** What the user is about to do, and what it costs. One or two sentences. */
  message: ReactNode
  confirmLabel?: ReactNode
  cancelLabel?: ReactNode
  /** `destructive` for anything that deletes or cannot be undone. */
  confirmVariant?: 'primary' | 'destructive'
  onConfirm: () => void
  onClose: () => void
  /** Disables confirm while the action is in flight. */
  busy?: boolean
}

/* Small by design: a confirm carries one question and two answers, so the `sm`
 * width tier is correct here and nowhere else. Cancel is a ghost button on the
 * leading side, confirm on the trailing one. */

/** "Are you sure?" — the yes/no dialog, as opposed to `<FormModal>` which collects
 *  input. `destructive` colours the confirm so a delete never looks like a save. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'primary',
  onConfirm,
  onClose,
  busy,
}: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} loading={busy}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {message}
    </Modal>
  )
}
