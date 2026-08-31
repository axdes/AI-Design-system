import './Alert.css'
import type { HTMLAttributes, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/cn'
import { Icon, type IconName } from '../Icon'
import { IconButton } from '../IconButton'
import { Tooltip } from '../Tooltip'

type Tone = 'neutral' | 'danger' | 'warning' | 'success' | 'info'

const TONE_ICON: Record<Tone, IconName> = {
  neutral: 'info',
  info: 'info',
  success: 'check_circle',
  warning: 'warning',
  danger: 'error',
}

type Props = HTMLAttributes<HTMLDivElement> & {
  /** What KIND of news it is, and it decides whether the reader must act: `danger` something is
   *  broken now, `warning` something will break, `success` it worked, `info` context they did
   *  not ask for, `neutral` a note. Everything toned danger is nothing toned danger.
   */
  tone?: Tone
  /** Override the tone icon (e.g. `sparkles` for AI-assist messages). */
  icon?: IconName
  /** Dense one-line variant: small padding, centred icon. */
  compact?: boolean
  /** Trailing action (e.g. a Button), pinned to the end of the alert row. */
  action?: ReactNode
  /* Dismissal is the consumer's job because the alert does not own its own
   * mounting: pass a handler and a close button appears. Suits info, success
   * and neutral notices; a warning or an error the user has not resolved yet
   * should stay on screen, so do not pass it there. */
  onDismiss?: () => void
}

/**
 * Inline message on a region: `tone` carries the meaning and `onDismiss` makes
 * it dismissible. Default role is status; pass role="alert" for an error.
 * Dismiss info and success, never an unresolved error.
 *
 * Copy: one sentence about what happened, in the reader's terms, not the
 * system's. A tone is not a substitute for words: "Saved" and "Could not
 * save — the file is open elsewhere" both need saying.
 */
export function Alert({ tone = 'info', icon, compact, action, onDismiss, className, role = 'status', children, ...rest }: Props) {
  const { t } = useTranslation()
  return (
    <div
      /* `tint`, not `card`: every alert is toned (the default is `info`), so its
       * background is never --card, and a quiet control on it must not fill with
       * the grey that answers a card. */
      className={cn('alert', className)} data-raised="tint"
      data-tone={tone}
      data-compact={compact || undefined}
      role={role}
      {...rest}
    >
      <Icon name={icon ?? TONE_ICON[tone]} className="alert-icon" />
      <div className="alert-body">{children}</div>
      {action && <div className="alert-action">{action}</div>}
      {onDismiss && (
        <Tooltip content={t('a11y.dismiss')}>
          <IconButton
            icon="close"
            variant="quiet"
            size="sm"
            className="alert-dismiss"
            aria-label={t('a11y.dismiss')}
            onClick={onDismiss}
          />
        </Tooltip>
      )}
    </div>
  )
}
