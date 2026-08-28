import './Truncate.css'
import { useEffect, useRef, useState } from 'react'
import { cn } from '../../lib/cn'
import { Tooltip } from '../Tooltip'

/** Named rather than inline for the same reason `Heat` is on `<Td>`: the
 *  registry compares the CSS's data-* values against the prop union as strings,
 *  and an inline numeric union fails a comparison it should never have made. */
type Lines = 1 | 2

type Props = {
  /** The whole value. What is shown is whatever fits; the tooltip carries the
   *  rest, so the text has to be a string. */
  children: string
  /** One line (the default) or two. Two is for the one description column a
   *  table is allowed; three is a paragraph, and a paragraph is not a cell. */
  lines?: Lines
  className?: string
}

/**
 * A value that does not fit, cut with an ellipsis, with the whole of it in a
 * tooltip. The tooltip appears only when the text is ACTUALLY clipped, so a
 * column of short values has no hover behaviour at all.
 *
 * A table gets one of three answers to a long value: wrap it (and lose the
 * scan), widen the row (and lose the page), or this. Never use it on a column
 * header: a header nobody can read is a column nobody can use.
 */
export function Truncate({ children, lines = 1, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const [clipped, setClipped] = useState(false)

  /* Measured, not guessed: whether a value is clipped depends on the column
   * width, which depends on every other value in the column. Re-measured on
   * resize, because a column that grows stops needing the tooltip. */
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setClipped(el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [children, lines])

  return (
    <Tooltip content={children} enabled={clipped}>
      <span ref={ref} className={cn('truncate', className)} data-lines={lines}>{children}</span>
    </Tooltip>
  )
}
