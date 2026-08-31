import './TagGroup.css'
import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/cn'
import { Chip } from '../Chip'
import { Tooltip } from '../Tooltip'

type Props = {
  /** Every label on the record, in the order it should be read. */
  items: readonly string[]
  /** How many are shown before the overflow. Two in a table cell, more in a
   *  panel where the row height is not shared with two hundred other rows. */
  max?: number
  className?: string
}

/**
 * Several labels in one cell, with the ones that do not fit counted rather than
 * wrapped: a wall of pills makes every row a different height and the column
 * unreadable. The overflow says how many are left and names them on hover.
 *
 * The twin of `AvatarGroup`, which does the same for faces.
 */
export function TagGroup({ items, max = 2, className }: Props) {
  const { t } = useTranslation()
  const shown = items.slice(0, max)
  const rest = items.slice(max)

  return (
    <span className={cn('tag-group', className)}>
      {shown.map((label) => <Chip key={label}>{label}</Chip>)}
      {rest.length > 0 && (
        /* The rest are named, not just counted: a "+3" nobody can resolve is a
         * number, and a number is not a label. The names are IN the element for
         * a screen reader (off screen) and in a tooltip for a pointer, which is
         * why this does not need to be a tab stop: a focusable span with no
         * behaviour is a stop in the tab order that does nothing. */
        <Tooltip content={rest.join(', ')}>
          <span className="tag-group-more">
            {t('table.moreTags', { count: rest.length })}
            <span className="sr-only"> ({rest.join(', ')})</span>
          </span>
        </Tooltip>
      )}
    </span>
  )
}
