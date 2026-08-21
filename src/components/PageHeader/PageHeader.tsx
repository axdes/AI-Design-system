import './PageHeader.css'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { IconButton } from '../IconButton'
import { NavDrawerButton } from '../NavDrawerButton'
import { Tooltip } from '../Tooltip'

type Props = {
  /** Optional — omit for pages that center their own hero title instead. */
  title?: ReactNode
  /** Renders a leading circular back button before the title. */
  onBack?: () => void
  /** Accessible label for the back button. */
  backLabel?: string
  /** Inline tools next to the title (search, filters). */
  inline?: ReactNode
  /** Trailing actions pinned to the far end (create button, user menu). */
  actions?: ReactNode
}

/**
 * The top of a page: title, breadcrumb and the page-level actions. Page chrome
 * belongs here, not in a screen's own CSS. The title stands alone by RULE: no
 * text renders under it (a subtitle prop existed and was removed 2026-08-20 —
 * explanatory lines under titles are banned from this system; what used to live
 * there is content and belongs in the page body).
 */
export function PageHeader({ title, onBack, backLabel, inline, actions }: Props) {
  const { t } = useTranslation()
  return (
    <header className="page-header">
      <div className="page-header-row">
        {/* ONE leading slot, and the two things that can occupy it are mutually
          * exclusive. This is the Material 3 top-app-bar rule and the Apple HIG
          * navigation-bar rule alike: a screen shows "back" when there is
          * somewhere to go back to, and the drawer trigger when there is not.
          * Both at once means two ways out fighting for the same corner.
          *
          * They did fight, for one iteration: the trigger was `position: fixed`
          * in the viewport corner instead, and the sticky opaque header painted
          * over the top half of it. Putting it in the flow, here, is what stops
          * that from being possible at all. */}
        {onBack ? (
          <Tooltip content={backLabel ?? t('a11y.back', { defaultValue: 'Back' })}>
            <IconButton
              icon="arrow_back"
              size="md"
              variant="filled"
              className="page-header-back"
              aria-label={backLabel ?? t('a11y.back', { defaultValue: 'Back' })}
              onClick={onBack}
            />
          </Tooltip>
        ) : (
          <NavDrawerButton />
        )}
        {title && (
          <div className="page-header-titles">
            <h1 className="page-title">{title}</h1>
          </div>
        )}
        {inline && <div className="page-header-inline">{inline}</div>}
        {actions && <div className="page-header-actions">{actions}</div>}
      </div>
    </header>
  )
}
