import './WizardTemplate.css'
import { type ReactNode } from 'react'
import { Button } from '../../components/Button'
import { Page } from '../Page'
import { Stepper } from '../../components/Stepper'
import { cn } from '../../lib/cn'

type WizardStep = {
  /** Stable id — put it in the URL (?step=) so deep links survive. */
  id: string
  label: string
  description?: string
}

type Props = {
  /** Page title in the header. */
  title?: ReactNode
  /** The ordered steps: 3-5. A 2-step wizard is a form with extra clicks. */
  steps: WizardStep[]
  /** Current step id — the parent owns it, usually mirrored into the URL. */
  current: string
  /** Back, Next and clicks on visited steps all arrive here. */
  onSelect: (id: string) => void
  /** The current step's content. */
  children?: ReactNode
  backLabel?: string
  nextLabel?: string
  /** Names the real event ("Create schedule"), never "Submit". */
  /* ReactNode: the same word means the same shape everywhere in this system,
   * and its neighbours already took one. Widened 2026-09-03; it is rendered
   * as content here, never put in an attribute. */
  submitLabel: ReactNode
  onSubmit: () => void
  /** Submitting: the submit carries the spinner, the rest disables. */
  busy?: boolean
  className?: string
}

/**
 * The WIZARD page skeleton: a Stepper over one step at a time, Back/Next
 * below, the last step submitting under the real event's name. Steps are
 * freely navigable, and the final step is a `<WizardReview>` whose Change
 * links jump straight back.
 *
 * Copy: the page title names the whole job, the step names are its parts —
 * nouns, parallel, and the same word in the stepper as in the step's own
 * heading.
 */
export function WizardTemplate({
  title,
  steps,
  current,
  onSelect,
  children,
  backLabel = 'Back',
  nextLabel = 'Next',
  submitLabel,
  onSubmit,
  busy,
  className,
}: Props) {
  const index = Math.max(0, steps.findIndex((s) => s.id === current))
  const last = index === steps.length - 1
  return (
    /* The header inside the capped column is now the `wizard` archetype's
     * geometry, held once in <Page>: a form column is narrower than the page,
     * and a far-edge title above it reads as two screens. */
    <Page archetype="wizard" className={cn('wizard-shell', className)} title={title}>
      <div className="wizard-page">
        <Stepper
          steps={steps.map(({ label, description }) => ({ label, description }))}
          current={index}
          onSelect={(i) => onSelect(steps[i].id)}
        />
        <div className="wizard-step">{children}</div>
        {/* No Cancel here on purpose: leaving a wizard belongs to the screen's
          * own chrome (back in the header, the shell's nav) — the live case
          * (a product's wrap-up) never had one and nobody missed it. */}
        <div className="wizard-actions">
          {index > 0 && (
            <Button variant="secondary" onClick={() => onSelect(steps[index - 1].id)} disabled={busy}>
              {backLabel}
            </Button>
          )}
          {last ? (
            <Button variant="primary" onClick={onSubmit} loading={busy}>
              {submitLabel}
            </Button>
          ) : (
            <Button variant="primary" onClick={() => onSelect(steps[index + 1].id)} disabled={busy}>
              {nextLabel}
            </Button>
          )}
        </div>
      </div>
    </Page>
  )
}

/**
 * The check-answers step: label/value rows in flow order, each with a Change
 * link jumping back to its step — change, land back here, nothing re-asked.
 */
export function WizardReview({ children, className }: { children?: ReactNode; className?: string }) {
  return <dl className={cn('wizard-review', className)}>{children}</dl>
}

type ReviewRowProps = {
  label: string
  /** The answer. An empty optional reads "Not provided", not nothing. */
  children?: ReactNode
  /** Jumps back to the step that owns this answer. */
  onEdit?: () => void
  editLabel?: string
}

export function WizardReviewRow({ label, children, onEdit, editLabel = 'Change' }: ReviewRowProps) {
  return (
    <div className="wizard-review-row">
      <dt>{label}</dt>
      <dd>{children ?? 'Not provided'}</dd>
      {onEdit && (
        <dd className="wizard-review-edit">
          {/* The accessible name carries the field, GOV.UK's rule: five bare
            * "Change" links say nothing to a screen reader's link list. */}
          <Button variant="link" onClick={onEdit} aria-label={`${editLabel}: ${label}`}>
            {editLabel}
          </Button>
        </dd>
      )}
    </div>
  )
}
