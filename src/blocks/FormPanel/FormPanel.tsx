import './FormPanel.css'
import { type ReactNode } from 'react'
import { Button } from '../../components/Button'
import { ErrorSummary, type FormError } from '../../components/ErrorSummary'
import { FormStack } from '../../components/FormStack'
import { SidePanel } from '../../components/SidePanel'
import { cn } from '../../lib/cn'

type Props = {
  /* ReactNode, like every other title in this system: a heading routinely
   * carries a status beside the words or a product name in the brand colour,
   * and typing it as a string is what sends a screen off to hand-roll its own
   * header. Widened 2026-09-03; nothing here puts it in an attribute — the
   * dialog labels itself by id, not by the text. */
  title: ReactNode
  /** The Field rows, or a `<FormSection>` stack for a longer panel. */
  children: ReactNode
  /** What the last submit rejected, above the first field. */
  errors?: FormError[]
  /** Names the real event ("Save changes"), never "Submit". */
  /* ReactNode: the same word means the same shape everywhere in this system,
   * and its neighbours already took one. Widened 2026-09-03; it is rendered
   * as content here, never put in an attribute. */
  submitLabel?: ReactNode
  /* ReactNode: the same word means the same shape everywhere in this system,
   * and its neighbours already took one. Widened 2026-09-03; it is rendered
   * as content here, never put in an attribute. */
  cancelLabel?: ReactNode
  onSubmit: () => void
  onClose: () => void
  /** Stops a second submit while one is in flight. Release it in `finally`, never in `then`: a
   *  rejected save has to give the button back.
   */
  busy?: boolean
  className?: string
}

/**
 * A form in a SIDE PANEL: the same contract as a form in a `<Modal>` for the case a
 * dialog gets wrong, where the record or list behind it has to stay readable
 * while the fields are filled in. Past a panel's worth of fields it is a
 * `<FormPageTemplate>`.
 *
 * Copy: same words as the page-sized form: the title names the job, the submit
 * label carries its verb. A panel is not a reason to shorten a label to
 * "OK".
 */
export function FormPanel({
  title,
  children,
  errors,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  onSubmit,
  onClose,
  busy,
  className,
}: Props) {
  return (
    <SidePanel
      title={title}
      onClose={onClose}
      className={cn('form-panel', className)}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button variant="primary" onClick={onSubmit} loading={busy}>
            {submitLabel}
          </Button>
        </>
      }
    >
      {errors && errors.length > 0 && <ErrorSummary errors={errors} />}
      <FormStack>{children}</FormStack>
    </SidePanel>
  )
}
