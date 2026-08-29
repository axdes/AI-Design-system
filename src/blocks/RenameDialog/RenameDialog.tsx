import { useId, useRef, useState, type ReactNode } from 'react'
import { Field } from '../../components/Field'
import { FormStack } from '../../components/FormStack'
import { Input } from '../../components/Input'
import { Modal } from '../../components/Modal'

type Props = {
  /** The caller owns it, and it should close once the rename has been accepted, not when the
   *  button was pressed.
   */
  open: boolean
  /** Dialog title, e.g. "Rename recording". */
  title: string
  /** Label over the single field. */
  label: string
  /** The current name. The field opens seeded with it, selected. */
  initial: string
  confirmLabel?: ReactNode
  cancelLabel?: ReactNode
  onClose: () => void
  /** Called only with a trimmed, non-empty name that differs from `initial`. */
  onSave: (name: string) => void
}

/* Pair it with a `⋮` menu on a list row: a row that can be deleted can almost
 * always be renamed, and offering only the destructive half of that pair is what
 * puts a bare trash icon on a card. */

/**
 * Give one thing a new name: a dialog with a single field, Enter to save; an
 * empty name cannot submit and an unchanged one closes without `onSave`.
 *
 * It stays a block of its own where <FormModal> and <ConfirmDialog> did not,
 * because it carries BEHAVIOUR a Modal cannot: the reseed on open, the
 * focus-and-select exactly once, Enter, and those submit semantics. Arrangement
 * belongs in Modal; behaviour is what earns a name (2026-08-26).
 *
 * Copy: the title names the thing being renamed — "Rename recording" — and the
 * field label is the value, not the act: "Name", not "New name".
 */
export function RenameDialog(props: Props) {
  /* Remounting IS the reseed. The state has to start from `initial` every time a
   * different row opens the dialog, and the obvious way to write that is an
   * effect that assigns state on `open` — which is a cascading render, and which
   * the compiler rules flag. A key over (open, initial) gets the same result with
   * no effect: the body is a fresh component each time it opens. */
  return <RenameBody key={`${String(props.open)}|${props.initial}`} {...props} />
}

function RenameBody({
  open,
  title,
  label,
  initial,
  confirmLabel = 'Rename',
  cancelLabel = 'Cancel',
  onClose,
  onSave,
}: Props) {
  const [name, setName] = useState(initial)
  const fieldId = useId()
  /* Focus and select on first mount only. A bare `autoFocus` is a jsx-a11y
   * finding, and an unguarded callback ref re-selects the text on every
   * keystroke, which eats what the user just typed. */
  const focusedRef = useRef(false)

  const submit = () => {
    const next = name.trim()
    if (next && next !== initial) onSave(next)
    else onClose()
  }

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      actions={{
        onConfirm: submit,
        confirmLabel,
        cancelLabel,
        /* Not `busy`: an empty name is "nothing to confirm yet", not "in
           flight". The two shared one word until Modal split them. */
        confirmDisabled: !name.trim(),
      }}
    >
      <FormStack>
      <Field label={label} htmlFor={fieldId}>
        <Input
          id={fieldId}
          value={name}
          /* Tells <Modal> that this, not the close button, is where the dialog
             opens. The ref below adds the selection so typing replaces the name. */
          data-autofocus
          ref={(el: HTMLInputElement | null) => {
            if (el && !focusedRef.current) {
              focusedRef.current = true
              /* Both calls, in this order. In a browser `select()` focuses as a
                 side effect; jsdom implements only the selection, so relying on
                 that side effect means the test cannot see what the user gets.
                 Saying it outright costs one line and is true everywhere. */
              el.focus()
              el.select()
            }
          }}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
          }}
        />
      </Field>
      </FormStack>
    </Modal>
  )
}
