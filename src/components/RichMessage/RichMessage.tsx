import './RichMessage.css'
import { type ReactNode } from 'react'
import { cn } from '../../lib/cn'

/* The shapes a producer sends INSTEAD of markup. Nothing here ever receives
 * HTML, so nothing here sanitises any — the contract its first consumer proved
 * against real Teams traffic. */
export type RichBlock =
  | { t: 'p'; text: string }
  | { t: 'h'; text: string }
  | { t: 'hr' }
  | { t: 'quote'; text: string }
  | { t: 'code'; text: string }
  | { t: 'li'; items: string[]; ordered?: boolean }
  | { t: 'table'; rows: string[][]; head?: boolean }

/* Inline marks: **bold**, `code`, *emphasis*. Marks, not tags, so a message
 * that literally contains asterisks still renders as written. */
const MARK = /(\*\*[^*\n]+\*\*|`[^`\n]+`|\*[^*\n]+\*)/g

function inline(text: string): ReactNode[] {
  return String(text).split(MARK).filter(Boolean).map((part, i) => {
    if (part.length > 4 && part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>
    if (part.length > 2 && part.startsWith('`') && part.endsWith('`')) return <code key={i} className="rich-message-inline-code">{part.slice(1, -1)}</code>
    if (part.length > 2 && part.startsWith('*') && part.endsWith('*')) return <em key={i}>{part.slice(1, -1)}</em>
    return part
  })
}

type Props = {
  /** The message as typed blocks. Absent (an old cache, a plain producer) falls back to `text` as one paragraph. */
  blocks?: RichBlock[]
  /** The flat text, always present — the words survive even when the shapes did not. */
  text: string
  className?: string
}

/**
 * A message or AI answer as it was written: headings, quotes, code, lists and
 * tables from TYPED blocks — never from HTML, so there is nothing to sanitise
 * and nothing to inject. A table scrolls inside its own container; a thread
 * that scrolls sideways has stopped being readable.
 */
export function RichMessage({ blocks, text, className }: Props) {
  if (!blocks?.length) return <p className={cn('rich-message-text', className)}>{text}</p>
  return (
    <div className={className}>
      {blocks.map((b, i) => {
        const key = `${b.t}-${i}`
        if (b.t === 'h') return <b key={key} className="rich-message-heading">{inline(b.text)}</b>
        if (b.t === 'hr') return <hr key={key} className="rich-message-rule" />
        if (b.t === 'quote') return <blockquote key={key} className="rich-message-quote">{inline(b.text)}</blockquote>
        if (b.t === 'code') return <pre key={key} className="rich-message-code"><code>{b.text}</code></pre>
        if (b.t === 'li') {
          const List = b.ordered ? 'ol' : 'ul'
          return <List key={key} className="rich-message-list">{b.items.map((item, n) => <li key={n}>{inline(item)}</li>)}</List>
        }
        if (b.t === 'table') {
          const head = b.head ? b.rows[0] : null
          const rest = b.head ? b.rows.slice(1) : b.rows
          return (
            <div key={key} className="rich-message-table-scroll">
              <table className="rich-message-table">
                {head && <thead><tr>{head.map((c, n) => <th key={n}>{inline(c)}</th>)}</tr></thead>}
                <tbody>{rest.map((row, n) => <tr key={n}>{row.map((c, j) => <td key={j}>{inline(c)}</td>)}</tr>)}</tbody>
              </table>
            </div>
          )
        }
        return <p key={key} className="rich-message-text">{inline(b.text)}</p>
      })}
    </div>
  )
}
