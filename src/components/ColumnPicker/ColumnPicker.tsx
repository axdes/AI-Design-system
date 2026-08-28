import './ColumnPicker.css'
import { useTranslation } from 'react-i18next'
import { Button } from '../Button'
import { Checkbox } from '../Checkbox'
import { Icon } from '../Icon'
import { IconButton } from '../IconButton'
import { Popover } from '../Popover'
import { Tooltip } from '../Tooltip'
import { cn } from '../../lib/cn'

export type PickableColumn = {
  key: string
  label: string
  /** The identifier column. It cannot be hidden or moved: a table whose first
   *  column is gone is a table of unlabelled values. */
  locked?: boolean
}

type Props = {
  /** Every column the table CAN show, in the order it shows them. */
  columns: readonly PickableColumn[]
  /** The keys currently shown. */
  visible: readonly string[]
  onChange: (keys: string[]) => void
  /** Moves a column one place, so the order is reachable without dragging.
   *  Leave it out and the picker only hides and shows. */
  onMove?: (key: string, direction: -1 | 1) => void
  /** Back to the columns the table shipped with. A picker with no way back is
   *  a picker nobody tries twice. */
  onReset?: () => void
  className?: string
}

/**
 * Which columns a table shows, and in what order. A card of controls on click,
 * so it is a `<Popover>` rather than a menu: the reader ticks several boxes in
 * one visit and the table changes under it.
 *
 * The choice belongs to the reader and to this collection, so persist it per
 * table (localStorage or the user's settings) rather than resetting it on every
 * visit.
 */
export function ColumnPicker({ columns, visible, onChange, onMove, onReset, className }: Props) {
  const { t } = useTranslation()
  const shown = new Set(visible)

  const toggle = (key: string) => {
    const next = columns.filter((c) => (c.key === key ? !shown.has(key) : shown.has(c.key))).map((c) => c.key)
    onChange(next)
  }

  return (
    <Popover
      label={t('table.columns')}
      trigger={(props) => (
        <Button variant="secondary" size="sm" {...props}>
          {t('table.columns')}
          <Icon name="arrow_drop_down" />
        </Button>
      )}
      className={cn('column-picker', className)}
    >
      <ul className="column-picker-list">
        {columns.map((col, i) => (
          <li key={col.key} className="column-picker-row">
            <Checkbox
              label={col.label}
              checked={col.locked || shown.has(col.key)}
              disabled={col.locked}
              onChange={() => toggle(col.key)}
            />
            {onMove && !col.locked && (
              <span className="column-picker-move">
                <Tooltip content={`Move ${col.label} up`}>
                  <IconButton
                    icon="arrow_upward"
                    size="sm"
                    variant="quiet"
                    aria-label={`Move ${col.label} up`}
                    disabled={i === 0}
                    onClick={() => onMove(col.key, -1)}
                  />
                </Tooltip>
                <Tooltip content={`Move ${col.label} down`}>
                  <IconButton
                    icon="arrow_downward"
                    size="sm"
                    variant="quiet"
                    aria-label={`Move ${col.label} down`}
                    disabled={i === columns.length - 1}
                    onClick={() => onMove(col.key, 1)}
                  />
                </Tooltip>
              </span>
            )}
          </li>
        ))}
      </ul>
      {onReset && (
        <Button variant="ghost" size="sm" onClick={onReset}>{t('table.resetColumns')}</Button>
      )}
    </Popover>
  )
}
