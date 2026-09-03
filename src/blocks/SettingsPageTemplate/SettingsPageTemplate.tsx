import './SettingsPageTemplate.css'
import { type ReactNode } from 'react'
import { Card } from '../../components/Card'
import { Page } from '../Page'
import { cn } from '../../lib/cn'

type Props = {
  /** Page title in the header. */
  title?: ReactNode
  /** Header actions — typically nothing: settings save per control or per row. */
  actions?: ReactNode
  /** The `<SettingsSection>` stack. */
  children?: ReactNode
  /** Extra class on the page wrapper. */
  className?: string
}

/**
 * The SETTINGS page skeleton: a deliberately narrow column of sections, each a
 * Card of explained rows. Found by scanning, so the words carry it: group by
 * who a knob affects, and every row says what it actually changes.
 *
 * Copy: the title is the area, not the word "Settings" twice over. Each row's
 * label is the setting as the reader would ask for it, and its description
 * says what changes when it does.
 */
export function SettingsPageTemplate({ title, actions, children, className }: Props) {
  return (
    /* The narrow column and the header inside it are the `settings` archetype's
     * geometry now, held once in <Page>: settings are read line by line, and a
     * title flush to the far page edge above a narrow column reads as two
     * screens. This block's own argument, generalised. */
    <Page archetype="settings" className={cn('settings-shell', className)} title={title} actions={actions}>
      <div className="settings-page">{children}</div>
    </Page>
  )
}

type SectionProps = {
  /** The group's name — who or what these knobs affect. */
  title: ReactNode
  /** One scannable sentence on what lives here. */
  description?: ReactNode
  children?: ReactNode
  className?: string
}

/**
 * One settings group: a Card whose head names the group and whose body stacks
 * `<SettingRow>`s with a hairline between them. A destructive action is just a
 * row whose control is a destructive Button — no red frame around the section.
 */
export function SettingsSection({ title, description, children, className }: SectionProps) {
  return (
    <Card stretch className={cn('settings-section', className)}>
      {/* A div, not <header>: outside sectioning content a <header> is a banner
        * landmark, and one per section trips axe's landmark-unique. */}
      <div className="settings-section-head">
        <h2 className="settings-section-title">{title}</h2>
        {description && <p className="settings-section-desc">{description}</p>}
      </div>
      <div className="settings-section-rows">{children}</div>
    </Card>
  )
}

type RowProps = {
  /** The knob's name. */
  label: ReactNode
  /** What changing it actually affects — the explanation is the point. */
  description?: ReactNode
  /** id of the control, so the label reaches it. */
  htmlFor?: string
  /** A small state mark beside the label (a "configured" Badge on a write-only secret). */
  badge?: ReactNode
  /** The control. */
  children?: ReactNode
  className?: string
}

/**
 * One settings row: name and explanation on the left, the control on the
 * right. Consolidated from an app's SettingsPage, where the contract was
 * proven: every knob says what it affects, or nobody dares touch it.
 */
export function SettingRow({ label, description, htmlFor, badge, children, className }: RowProps) {
  return (
    <div className={cn('settings-row', className)}>
      <div className="settings-row-info">
        <label className="settings-row-label" htmlFor={htmlFor}>
          {label}
          {badge}
        </label>
        {description && <p className="settings-row-desc">{description}</p>}
      </div>
      <div className="settings-row-control">{children}</div>
    </div>
  )
}
