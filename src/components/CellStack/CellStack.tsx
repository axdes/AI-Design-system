import './CellStack.css'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Props = {
  /** The value the column is about. */
  children: ReactNode
  /** The line under it: the address, the path, the code, the owner. One line,
   *  smaller and quieter, and never a second fact the column also sorts by. */
  secondary?: ReactNode
  className?: string
}

/**
 * Two facts in one cell, stacked: a title over its path, an invoice over its
 * supplier, a product over its SKU. The one place a table row is allowed two
 * lines, and only in ONE column of the table.
 *
 * `Identity` is this for a person (it brings the face). `MetaItem` is one piece
 * of secondary information with its icon, under a title rather than beside it.
 *
 * Copy: the secondary line is the first line's context, never a repeat of it: an
 * invoice over its supplier, a file over its folder.
 */
export function CellStack({ children, secondary, className }: Props) {
  return (
    <span className={cn('cell-stack', className)}>
      <span className="cell-stack-value">{children}</span>
      {secondary === undefined ? null : <span className="cell-stack-secondary">{secondary}</span>}
    </span>
  )
}
