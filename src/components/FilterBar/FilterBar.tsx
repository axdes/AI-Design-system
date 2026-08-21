import './FilterBar.css'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useMediaQuery } from '../../lib/useMediaQuery'
import { FilterBarContext } from '../../lib/filterBarContext'
import { Button } from '../Button'
import { IconButton } from '../IconButton'
import { Tooltip } from '../Tooltip'
import { Modal } from '../Modal'

type Props = {
  /** Filter dropdowns to show inline (desktop). */
  children: ReactNode
  /** Total active filter count across all filters — shows on mobile trigger. */
  activeCount: number
  /** Clears every filter. */
  onClear: () => void
  /** Always the icon + slide-out panel, at every width — for a screen that
   *  keeps its filters beside the search in the header row, where a row of
   *  chips has no room. The panel is the drawer Modal, sliding in from the
   *  inline end. Selections read per row: give each FilterDropdown `showTags`. */
  collapsed?: boolean
}

/* Below this width filters collapse into a "Filters" button + Modal sheet. */
const MOBILE_QUERY = '(max-width: 48rem)'

/**
 * The row of filters above a list: FilterDropdowns side by side on desktop,
 * one icon that opens them in a Modal sheet on mobile.
 */
export function FilterBar({ children, activeCount, onClear, collapsed }: Props) {
  const { t } = useTranslation()
  const isMobile = useMediaQuery(MOBILE_QUERY)
  const [open, setOpen] = useState(false)

  if (!collapsed && !isMobile) {
    return <div className="filter-bar">{children}</div>
  }

  return (
    <>
      <span className="filter-bar-trigger">
        <Tooltip content={t('filter.filters', { defaultValue: 'Filters' })}>
          <IconButton
            icon="tune"
            size="md"
            aria-label={t('filter.filters', { defaultValue: 'Filters' })}
            data-active={activeCount > 0 || undefined}
            onClick={() => setOpen(true)}
          />
        </Tooltip>
        {activeCount > 0 && <span className="filter-bar-count">{activeCount}</span>}
      </span>

      {/* A drawer, not a centred dialog: the panel slides in from the inline
        * end and the list stays visible behind it, so narrowing and watching
        * the result happen together. */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t('filter.filters', { defaultValue: 'Filters' })}
        placement="drawer"
        footer={
          /* No "Done": every filter applies the moment it is picked, so a
           * confirm button would only be a second Close. Clearing is the one
           * action that belongs down here. */
          <Button variant="secondary" onClick={onClear} disabled={activeCount === 0}>
            {t('filter.clearAll', { defaultValue: 'Clear all' })}
          </Button>
        }
      >
        <div className="filter-bar-sheet">
          <FilterBarContext value={{ inSheet: true }}>
            {children}
          </FilterBarContext>
        </div>
      </Modal>
    </>
  )
}
