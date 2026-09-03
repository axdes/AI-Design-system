import './ContentSidePanel.css'
import { useId, useState, type ReactNode } from 'react'
import { type IconName } from '../Icon'
import { IconButton } from '../IconButton'
import { Tooltip } from '../Tooltip'
import { SidePanel } from '../SidePanel'

export type SidePanelSection = {
  /** Stable key — also URL fragment for deep-linking later. */
  key: string
  icon: IconName
  /** Accessible label / tooltip text / panel heading. */
  label: string
  content: ReactNode
}

type Props = {
  sections: readonly SidePanelSection[]
  /** Optional default-open section by key. */
  /* `defaultSection`: <Accordion> publishes `defaultOpen` as the LIST of ids
   * that start open, and this panel opens exactly one. One word for a list and
   * for a single id is a word a caller has to check every time. (2026-09-03) */
  defaultSection?: string
}

/**
 * Document side panel: an icon rail that slides a SidePanel out over the
 * content, one panel per icon.
 */
export function ContentSidePanel({ sections, defaultSection }: Props) {
  const [open, setOpen] = useState<string | null>(defaultSection ?? null)
  const active = sections.find((s) => s.key === open) ?? null
  const panelId = useId()

  const toggle = (key: string) => setOpen((cur) => (cur === key ? null : key))

  return (
    <aside className="content-side-panel">
      {active && (
        <SidePanel
          id={panelId}
          className="content-side-panel-content"
          title={active.label}
          onClose={() => setOpen(null)}
        >
          {active.content}
        </SidePanel>
      )}
      {/* Disclosure buttons (not tabs — no tabpanel pattern). Each toggles its
       * panel via aria-expanded + aria-controls. */}
      <div className="content-side-panel-rail">
        {sections.map((s) => (
          <Tooltip key={s.key} content={s.label} placement="start">
            <IconButton
              icon={s.icon}
              size="md"
              aria-label={s.label}
              aria-expanded={open === s.key}
              aria-controls={open === s.key ? panelId : undefined}
              data-open={open === s.key || undefined}
              onClick={() => toggle(s.key)}
            />
          </Tooltip>
        ))}
      </div>
    </aside>
  )
}
