import './DiffTable.css'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { Table, TableScroll, THead, TBody, Tr, Th, Td } from '../Table'

export type DiffChange = {
  /** What changed: the field, the setting, the line. */
  field: ReactNode
  before?: ReactNode
  after?: ReactNode
  /** Defaults to `changed`. `added` has no before, `removed` has no after. */
  kind?: 'added' | 'removed' | 'changed'
}

type Props = {
  label: string
  /** Hides the caption visually and KEEPS it for a screen reader. The caption is how a table
   *  announces what it is, so this hides it; it never removes it.
   */
  captionHidden?: boolean
  changes: readonly DiffChange[]
  /** Column headings, when "Before" and "After" are not the words this domain
   *  uses (a review says Submitted and Approved). */
  beforeHeader?: ReactNode
  afterHeader?: ReactNode
  /** The word for a side that does not exist: an added field had no before. */
  noneLabel?: string
  className?: string
}

/**
 * What changed, side by side: an audit trail, a review of an edit, a settings
 * history. The row is a change rather than a record, which is why the two
 * columns are the same field at two times instead of two fields.
 *
 * Colour marks the kind of change and never carries it alone: every row says
 * added, removed or changed in words too.
 *
 * Copy: column headers name the two versions the reader is comparing — "Before"
 * and "After", or the two dates — never "Old" and "New" when the reader
 * thinks in dates.
 */
export function DiffTable({
  label, captionHidden, changes, beforeHeader = 'Before', afterHeader = 'After', noneLabel = 'None', className,
}: Props) {
  const tone = (kind: DiffChange['kind']) => {
    if (kind === 'added') return 'success' as const
    if (kind === 'removed') return 'danger' as const
    return undefined
  }

  return (
    <TableScroll label={label}>
      <Table caption={label} captionHidden={captionHidden} className={cn('diff-table', className)}>
        <THead>
          <Tr>
            <Th scope="col">Field</Th>
            <Th scope="col">{beforeHeader}</Th>
            <Th scope="col">{afterHeader}</Th>
            <Th scope="col">Change</Th>
          </Tr>
        </THead>
        <TBody>
          {changes.map((c, i) => {
            const kind = c.kind ?? 'changed'
            return (
              <Tr key={i}>
                <Th scope="row" emphasis>{c.field}</Th>
                <Td tone={kind === 'removed' ? tone(kind) : undefined} className="diff-before">
                  {c.before ?? noneLabel}
                </Td>
                <Td tone={kind === 'added' ? tone(kind) : undefined}>{c.after ?? noneLabel}</Td>
                {/* The word, always. A row read in greyscale or out loud says
                    the same thing as a row read in colour. */}
                <Td className="diff-kind">{kind}</Td>
              </Tr>
            )
          })}
        </TBody>
      </Table>
    </TableScroll>
  )
}
