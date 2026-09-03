import './Pagination.css'
import { cn } from '../../lib/cn'
import { Button } from '../Button'
import { IconButton } from '../IconButton'
import { Tooltip } from '../Tooltip'

/* Monolithic because the arrows have no words on screen: their labels live
 * in aria-label and a tooltip, so a translated pagination needs all three of
 * page, count and the two names in one call. */
type Props = {
  /** 1-based current page. */
  page: number
  /** Total number of pages. */
  pageCount: number
  onChange: (page: number) => void
  /** How many numbered buttons to show around the current page. Default 1
   *  (so: first … prev-cur-next … last). */
  siblingCount?: number
  /** Accessible names — the control is a labelled navigation landmark. */
  label?: string
  prevLabel?: string
  nextLabel?: string
  className?: string
}

/* Build the visible page list with gaps: always the first and last page, a
 * window of `siblingCount` either side of the current one, and an ellipsis
 * marker (rendered as a non-interactive gap) where pages are skipped. */
function pages(page: number, pageCount: number, siblings: number): (number | 'gap')[] {
  const out: (number | 'gap')[] = []
  const push = (n: number | 'gap') => out.push(n)
  const first = 1
  const last = pageCount
  const start = Math.max(first, page - siblings)
  const end = Math.min(last, page + siblings)

  push(first)
  if (start > first + 1) push('gap')
  for (let n = start; n <= end; n++) if (n !== first && n !== last) push(n)
  if (end < last - 1) push('gap')
  if (last !== first) push(last)
  return out
}

/**
 * Pager for a known total: renders nothing for a single page and collapses
 * long ranges with gaps. LoadMore is the one for a list with no total.
 *
 * Copy: the accessible name says WHICH collection is paged — "Invoices pages",
 * not "Pagination". A screen with two paged lists is otherwise two
 * identical controls.
 */
export function Pagination({
  page, pageCount, onChange, siblingCount = 1, label = 'Pagination', prevLabel = 'Previous page', nextLabel = 'Next page', className,
}: Props) {
  if (pageCount <= 1) return null
  const items = pages(page, pageCount, siblingCount)

  return (
    <nav className={cn('pagination', className)} aria-label={label}>
      <Tooltip content={prevLabel}>
        <IconButton
          icon="chevron_left"
          variant="quiet"
          aria-label={prevLabel}
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        />
      </Tooltip>

      <ul className="pagination-pages">
        {items.map((item, i) =>
          item === 'gap' ? (
            // eslint-disable-next-line @eslint-react/no-array-index-key -- gaps have no stable id; position is their identity
            <li key={`gap-${i}`} className="pagination-gap" aria-hidden="true">…</li>
          ) : (
            <li key={item}>
              {/* A numbered page IS a small button, and it used to be a
                  hand-drawn one: fifty lines restating the pill, the hover, the
                  pressed step, the focus ring and the disabled state that
                  `size="sm"` already carries. The variant is the whole decision
                  it makes on its own, since the current page is the one that is
                  filled. */}
              <Button
                size="sm"
                variant={item === page ? 'primary' : 'ghost'}
                className="pagination-page"
                data-current={item === page || undefined}
                aria-current={item === page ? 'page' : undefined}
                aria-label={`Page ${item}`}
                onClick={() => { onChange(item) }}
              >
                {item}
              </Button>
            </li>
          ),
        )}
      </ul>

      <Tooltip content={nextLabel}>
        <IconButton
          icon="chevron_right"
          variant="quiet"
          aria-label={nextLabel}
          disabled={page >= pageCount}
          onClick={() => onChange(page + 1)}
        />
      </Tooltip>
    </nav>
  )
}
