import './Tag.css'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { Icon } from '../Icon'
import { Tooltip } from '../Tooltip'

type Props = {
  children: ReactNode
  /** When set, renders a trailing remove button that calls this on click. */
  onRemove?: () => void
  /** Accessible label + tooltip for the remove button (required when removable). */
  removeLabel?: string
  size?: 'sm' | 'md'
  className?: string
}

/* A static, non-interactive label token in a pill — the read-only counterpart to
 * <Chip> (which is a button). Optionally removable: the label does nothing, only
 * the trailing X drops the token, so the remove control can be its own button
 * (a remove button nested inside a Chip button would be invalid HTML). */
export function Tag({ children, onRemove, removeLabel, size = 'sm', className }: Props) {
  return (
    <span className={cn('tag', className)} data-size={size}>
      <span className="tag-label">{children}</span>
      {onRemove && (
        <Tooltip content={removeLabel ?? ''}>
          <button type="button" className="tag-remove" aria-label={removeLabel} onClick={onRemove}>
            <Icon name="close" />
          </button>
        </Tooltip>
      )}
    </span>
  )
}
