import './SidePanel.css'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/cn'
import { IconButton } from '../IconButton'
import { Tooltip } from '../Tooltip'

type Props = {
  /** Panel heading. */
  title: ReactNode
  /** Shows a close button in the header when provided. */
  onClose?: () => void
  /** Controls in the header, before the close button (e.g. a collapse toggle). */
  headerActions?: ReactNode
  /** Pinned footer (e.g. Submit / Cancel actions). */
  footer?: ReactNode
  children: ReactNode
  id?: string
  className?: string
  /** Region label; defaults to `title` when it is a plain string. */
  label?: string
}

/* Reusable side-panel chrome: header (title + optional close) over a scrolling
 * body, with an optional pinned footer. The container's width/borders/radius are
 * left to the consumer via `className`. Used by ContentSidePanel and form panels. */
export function SidePanel({ title, onClose, headerActions, footer, children, id, className, label }: Props) {
  const { t } = useTranslation()
  return (
    <section
      id={id}
      className={cn('side-panel', className)}
      aria-label={label ?? (typeof title === 'string' ? title : undefined)}
    >
      <header className="side-panel-header">
        <h2 className="side-panel-title">{title}</h2>
        {headerActions && <div className="side-panel-actions">{headerActions}</div>}
        {onClose && (
          <Tooltip content={t('a11y.close')}>
            <IconButton icon="close" size="md" aria-label={t('a11y.close')} onClick={onClose} />
          </Tooltip>
        )}
      </header>
      {/* The body scrolls, so it is a tab stop: a region a mouse can scroll and a keyboard cannot
        * reach is content that exists only for some people (axe: scrollable-region-focusable).
        * jsx-a11y cannot tell that this div scrolls and asks for an interactive role, which would
        * be a lie; the panel's own <section aria-label> already names the region. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
      <div className="side-panel-body" tabIndex={0}>{children}</div>
      {footer && <footer className="side-panel-footer">{footer}</footer>}
    </section>
  )
}
