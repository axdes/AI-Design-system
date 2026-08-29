import './Highlight.css'
import { Fragment } from 'react'
import { cn } from '../../lib/cn'

type Props = {
  /** The full text to render. */
  text: string
  /** What to mark inside it. An empty query marks nothing. */
  query: string
  /** Off by default, which is what a search box wants: a reader who typed lower case still means
   *  the capitalised word. Turn it on only where case is part of the value, such as a code or an
   *  identifier.
   */
  caseSensitive?: boolean
  className?: string
}

/** Marks the matched part of a result, so a list of hits shows WHY each one is a
 *  hit. Uses a real `<mark>`: the highlight is a semantic emphasis, not a colour,
 *  and a screen reader is entitled to know which words matched. */
export function Highlight({ text, query, caseSensitive, className }: Props) {
  const needle = query.trim()
  if (!needle) return <span className={cn('highlight', className)}>{text}</span>

  const haystack = caseSensitive ? text : text.toLowerCase()
  const target = caseSensitive ? needle : needle.toLowerCase()
  const parts: { value: string; hit: boolean }[] = []
  let cursor = 0

  /* indexOf rather than a RegExp: the query is user input, and building a
   * pattern out of it is either an escaping bug or a catastrophic-backtracking
   * one. Scanning is also linear, which a search result list wants. */
  for (;;) {
    const at = haystack.indexOf(target, cursor)
    if (at === -1) break
    if (at > cursor) parts.push({ value: text.slice(cursor, at), hit: false })
    parts.push({ value: text.slice(at, at + needle.length), hit: true })
    cursor = at + needle.length
  }
  if (cursor < text.length) parts.push({ value: text.slice(cursor), hit: false })

  return (
    <span className={cn('highlight', className)}>
      {parts.map((part, i) => (
        <Fragment key={`${String(i)}-${part.value}`}>
          {part.hit ? <mark className="highlight-hit">{part.value}</mark> : part.value}
        </Fragment>
      ))}
    </span>
  )
}
