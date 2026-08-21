import './Stepper.css'
import { cn } from '../../lib/cn'
import { Icon } from '../Icon'

export type Step = {
  label: string
  /** Optional line under the label. */
  description?: string
}

type Props = {
  steps: Step[]
  /** 0-based index of the step in progress. Earlier steps read as complete. */
  current: number
  /** Lets the user jump back to a completed step. Only completed steps are
   *  interactive; the current and future ones are not. */
  onStepClick?: (index: number) => void
  /** Accessible name for the ordered list. Default "Progress". */
  label?: string
  className?: string
}

/* Progress across an ordered set of steps (a wizard, a multi-step form). Shows
 * which are done (check), which is active (aria-current="step") and which are
 * still ahead. Presentational: the parent owns `current` and what each step
 * contains. Completed steps can be clickable to go back. */
export function Stepper({ steps, current, onStepClick, label = 'Progress', className }: Props) {
  return (
    <ol className={cn('stepper', className)} aria-label={label}>
      {steps.map((step, i) => {
        const state = i < current ? 'complete' : i === current ? 'current' : 'upcoming'
        const clickable = state === 'complete' && onStepClick
        const marker = (
          <span className="stepper-marker" aria-hidden="true">
            {state === 'complete' ? <Icon name="check" /> : i + 1}
          </span>
        )
        const body = (
          <span className="stepper-text">
            <span className="stepper-label">{step.label}</span>
            {step.description && <span className="stepper-description">{step.description}</span>}
          </span>
        )
        return (
          <li key={step.label} className="stepper-step" data-state={state} aria-current={state === 'current' ? 'step' : undefined}>
            {clickable ? (
              <button type="button" className="stepper-button" onClick={() => onStepClick(i)}>
                {marker}
                {body}
              </button>
            ) : (
              <span className="stepper-button">
                {marker}
                {body}
              </span>
            )}
          </li>
        )
      })}
    </ol>
  )
}
