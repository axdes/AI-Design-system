import './SetupGuide.css'
import { type ReactNode } from 'react'
import { Card, CardHeader, CardTitle } from '../Card'
import { Icon } from '../Icon'
import { IconButton } from '../IconButton'
import { Tooltip } from '../Tooltip'
import { cn } from '../../lib/cn'

export type SetupStep = {
  id: string
  /** What to do, verb first. */
  label: string
  /** One sentence on why or how. */
  detail?: string
  done?: boolean
  /** The control that performs the step, or leads to it. */
  action?: ReactNode
}

type Props = {
  /** The guide's name ("Get set up"). */
  title: ReactNode
  steps: SetupStep[]
  /**
   * Dismiss, shown ONLY when every step is done. A dismissed guide never
   * returns (the caller persists that), so first-run and steady-state are one
   * page with a section that retires itself.
   */
  onDismiss?: () => void
  dismissLabel?: string
  className?: string
}

/**
 * The first-run checklist (Shopify's setup guide): steps with their state and
 * the control that performs each, a counted progress line, and a dismiss that
 * appears only when the work is done. Lives at the top of a product's home
 * until it has earned its removal.
 *
 * Copy: every step starts with a verb and describes one action — "Connect a
 * calendar". The detail says why it is worth doing, not how the control
 * works.
 */
export function SetupGuide({ title, steps, onDismiss, dismissLabel = 'Dismiss the guide', className }: Props) {
  const done = steps.filter((s) => s.done).length
  const all = done === steps.length
  return (
    <Card stretch className={cn('setup-guide', className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <span className="setup-guide-count">
          {done} of {steps.length} done
        </span>
        {all && onDismiss && (
          <Tooltip content={dismissLabel}>
            <IconButton icon="close" aria-label={dismissLabel} onClick={onDismiss} />
          </Tooltip>
        )}
      </CardHeader>
      <ol className="setup-guide-steps">
        {steps.map((s) => (
          <li key={s.id} className="setup-guide-step" data-done={s.done || undefined}>
            <span className="setup-guide-mark" aria-hidden="true">
              {s.done && <Icon name="check_circle" />}
            </span>
            <div className="setup-guide-text">
              <span className="setup-guide-label">{s.label}</span>
              {s.detail && <span className="setup-guide-detail">{s.detail}</span>}
            </div>
            {!s.done && s.action && <div className="setup-guide-action">{s.action}</div>}
          </li>
        ))}
      </ol>
    </Card>
  )
}
