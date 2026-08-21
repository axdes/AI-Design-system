import './WizardTemplate.css'
import { type ReactNode } from 'react'
import { Button } from '../../components/Button'
import { PageHeader } from '../../components/PageHeader'
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
  onStep: (id: string) => void
  /** The current step's content. */
  children?: ReactNode
  backLabel?: string
  nextLabel?: string
  /** Names the real event ("Create schedule"), never "Submit". */
  submitLabel: string
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
 */
export function WizardTemplate({
  title,
  steps,
  current,
  onStep,
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
    /* Header inside the capped column, SettingsPageTemplate's argument: a form
     * column is narrower than the page, and a far-edge title above it reads as
     * two screens. */
    <div className={cn('wizard-shell', className)}>
      <PageHeader title={title} />
      <div className="wizard-page">
        <Stepper
          steps={steps.map(({ label, description }) => ({ label, description }))}
          current={index}
          onStepClick={(i) => onStep(steps[i].id)}
        />
        <div className="wizard-step">{children}</div>
        {/* No Cancel here on purpose: leaving a wizard belongs to the screen's
          * own chrome (back in the header, the shell's nav) — the live case
          * (Salim's wrap-up) never had one and nobody missed it. */}
        <div className="wizard-actions">
          {index > 0 && (
            <Button variant="secondary" onClick={() => onStep(steps[index - 1].id)} disabled={busy}>
              {backLabel}
            </Button>
          )}
          {last ? (
            <Button variant="primary" onClick={onSubmit} loading={busy}>
              {submitLabel}
            </Button>
          ) : (
            <Button variant="primary" onClick={() => onStep(steps[index + 1].id)} disabled={busy}>
              {nextLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
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
