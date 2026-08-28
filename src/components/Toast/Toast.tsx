import './Toast.css'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '../Button'
import { Icon, type IconName } from '../Icon'
import { IconButton } from '../IconButton'
import { Tooltip } from '../Tooltip'
import { cn } from '../../lib/cn'

export type ToastTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

export type ToastItem = {
  id: string
  /** One line. What happened, in the past tense: "Report published". */
  title: ReactNode
  /** Optional second line, when the title cannot carry the consequence. */
  description?: ReactNode
  tone?: ToastTone
  /** The one thing to do about it — almost always Undo. */
  action?: { label: string; onAction: () => void }
  /** Milliseconds before it leaves. 0 keeps it until dismissed; that is the
   *  default for `danger`, because an error nobody read is an error nobody had. */
  duration?: number
}

const ICON: Record<ToastTone, IconName> = {
  neutral: 'info',
  info: 'info',
  success: 'check_circle',
  warning: 'warning',
  danger: 'error',
}

/** How long a toast stays when it does not say. */
const DEFAULT_DURATION = 5000

/**
 * A single transient confirmation — what happened, and the one thing to do
 * about it. Reach for it directly only when the message belongs inside a panel
 * rather than in the corner of the screen; everywhere else render
 * <ToastStack>, which is a positioned list of these and owns the timers.
 *
 * Copy: past tense and short: it appears after the fact. "Invoice sent", not
 * "Sending invoice". If there is an undo, the words say what will be
 * undone.
 */
export function Toast({ item, onDismiss, paused = false, dismissLabel = 'Dismiss' }: {
  item: ToastItem
  onDismiss: (id: string) => void
  /** The countdown is frozen (the stack is hovered or holds focus). */
  paused?: boolean
  dismissLabel?: string
}) {
  const tone = item.tone ?? 'neutral'
  const duration = item.duration ?? (tone === 'danger' ? 0 : DEFAULT_DURATION)
  /* What is LEFT, not how long it was: the countdown has to survive a pause, and
   * a plain timeout restarted on resume would give every hover a fresh 5s. */
  const remaining = useRef(duration)
  const startedAt = useRef(0)

  useEffect(() => {
    if (!duration || paused) {
      if (paused && startedAt.current) remaining.current -= Date.now() - startedAt.current
      return
    }
    startedAt.current = Date.now()
    const t = setTimeout(() => { onDismiss(item.id) }, Math.max(0, remaining.current))
    return () => { clearTimeout(t) }
  }, [duration, paused, item.id, onDismiss])

  return (
    <div
      className="toast" data-raised="popover"
      data-tone={tone}
      /* An error interrupts; everything else waits its turn. */
      role={tone === 'danger' ? 'alert' : 'status'}
    >
      <Icon name={ICON[tone]} className="toast-icon" />
      <div className="toast-body">
        <p className="toast-title">{item.title}</p>
        {item.description && <p className="toast-description">{item.description}</p>}
      </div>
      {item.action && (
        <Button
          variant="ghost"
          size="sm"
          className="toast-action"
          onClick={() => { item.action?.onAction(); onDismiss(item.id) }}
        >
          {item.action.label}
        </Button>
      )}
      <Tooltip content={dismissLabel}>
        <IconButton
          icon="close"
          size="sm"
          variant="quiet"
          aria-label={dismissLabel}
          className="toast-close"
          onClick={() => { onDismiss(item.id) }}
        />
      </Tooltip>
    </div>
  )
}

type StackProps = {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
  /** Which edge the stack sits on. Default `bottom` — out of the way of the
   *  work, and near the thumb on a phone. */
  side?: 'bottom' | 'top'
  /** Where along that edge. Default `end`, the corner. */
  align?: 'end' | 'center'
  /** Announced name of the region, and the dismiss button's name. */
  labels?: { region: string; dismiss: string }
  className?: string
}

/**
 * Transient confirmations, stacked in a corner. The consumer owns the array —
 * same contract as `<Modal open>` — so there is no global singleton, and a test
 * can put a toast on the screen without a provider.
 *
 * Timers pause while the pointer is over the stack or focus is inside it, so a
 * toast cannot expire while it is being read or while its Undo is being aimed
 * at (WCAG 2.2.1). Errors do not expire at all.
 */
export function ToastStack({
  toasts, onDismiss, side = 'bottom', align = 'end',
  labels = { region: 'Notifications', dismiss: 'Dismiss' },
  className,
}: StackProps) {
  const [paused, setPaused] = useState(false)
  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      className={cn('toast-stack', className)}
      data-side={side}
      data-align={align}
      role="region"
      aria-label={labels.region}
      onMouseEnter={() => { setPaused(true) }}
      onMouseLeave={() => { setPaused(false) }}
      onFocusCapture={() => { setPaused(true) }}
      onBlurCapture={() => { setPaused(false) }}
    >
      {toasts.map((item) => (
        <Toast key={item.id} item={item} onDismiss={onDismiss} paused={paused} dismissLabel={labels.dismiss} />
      ))}
    </div>,
    document.body,
  )
}
