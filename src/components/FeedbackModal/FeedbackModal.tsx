import './FeedbackModal.css'
import { useState } from 'react'
import { Button } from '../Button'
import { Chip } from '../Chip'
import { Textarea } from '../Textarea'
import { Field } from '../Field'
import { Modal } from '../Modal'

const REASONS = ['wrong', 'incomplete', 'unclear', 'other'] as const
type Reason = (typeof REASONS)[number]

/* All display copy comes from the caller — the DS component stays i18n-agnostic
 * (no useTranslation / no app locale keys baked in). */
export type FeedbackLabels = {
  title: string
  close: string
  send: string
  desc: string
  detailsLabel: string
  detailsPlaceholder: string
  reasons: Record<Reason, string>
}

type Props = {
  /** The caller owns it, and it should close on a successful send rather than on the press. */
  open: boolean
  onClose: () => void
  /** Called with the picked reason + free-text details on send. */
  onSubmit: (reason: Reason | null, details: string) => void
  labels: FeedbackLabels
}

/* "What went wrong?" — negative-feedback dialog (matches the original). */
export function FeedbackModal({ open, onClose, onSubmit, labels }: Props) {
  const [reason, setReason] = useState<Reason | null>(null)
  const [details, setDetails] = useState('')

  const reset = () => { setReason(null); setDetails('') }
  const close = () => { reset(); onClose() }
  const send = () => { onSubmit(reason, details.trim()); reset() }

  return (
    <Modal
      open={open}
      onClose={close}
      title={labels.title}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={close}>{labels.close}</Button>
          <Button onClick={send}>{labels.send}</Button>
        </>
      }
    >
      <p className="feedback-desc">{labels.desc}</p>
      <div className="feedback-reasons">
        {REASONS.map((r) => (
          <Chip
            key={r}
            selected={reason === r}
            onClick={() => setReason((cur) => (cur === r ? null : r))}
          >
            {labels.reasons[r]}
          </Chip>
        ))}
      </div>
      <Field label={labels.detailsLabel} htmlFor="feedback-details">
        <Textarea
          id="feedback-details"
          rows={4}
          placeholder={labels.detailsPlaceholder}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
        />
      </Field>
    </Modal>
  )
}
