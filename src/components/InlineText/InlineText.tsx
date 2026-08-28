import './InlineText.css'
import type { ElementType } from 'react'
import { cn } from '../../lib/cn'

/* True inline editing (the vanilla `.editable` contract): the SAME element
 * becomes editable on click — same font, same layout, no control chrome.
 * Enter commits, Escape reverts, blur saves. Key it by `value` upstream so a
 * server-confirmed update re-renders the committed text.
 *
 * Copy: the accessible label names the value being edited, not the act —
 * "Recording title", not "Edit title". */
export function InlineText({
  as: Tag = 'span',
  className,
  value,
  label,
  onSave,
  onAbort,
  autoFocus,
}: {
  as?: 'h2' | 'p' | 'span'
  className?: string
  value: string
  label: string
  onSave: (next: string) => void
  /** Called when editing ends without a change (composer rows close on this). */
  onAbort?: () => void
  autoFocus?: boolean
}) {
  const Element = Tag as ElementType
  /* A heading cannot carry role="textbox" (ARIA forbids overriding it, and axe
   * fails the element). So for `as="h2"` the heading stays a heading and the
   * editable textbox is a bare inline child, which inherits the heading's font
   * and layout — visually the same element, semantically valid. */
  const Editable = (Tag === 'h2' ? 'span' : Tag) as ElementType
  const editable = (
    <Editable
      ref={(el: HTMLElement | null) => {
        if (el && autoFocus) el.focus()
      }}
      className={cn('inline-text', Tag === 'h2' ? undefined : className)}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      role="textbox"
      aria-label={label}
      onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          ;(e.target as HTMLElement).blur()
        }
        if (e.key === 'Escape') {
          ;(e.target as HTMLElement).textContent = value
          ;(e.target as HTMLElement).blur()
        }
      }}
      onBlur={(e: React.FocusEvent<HTMLElement>) => {
        const next = (e.currentTarget.textContent ?? '').trim()
        if (next && next !== value) onSave(next)
        else {
          e.currentTarget.textContent = value
          onAbort?.()
        }
      }}
    >
      {value}
    </Editable>
  )

  if (Tag === 'h2') return <Element className={className}>{editable}</Element>
  return editable
}
