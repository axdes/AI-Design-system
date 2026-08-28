import './ErrorSummary.css'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/cn'

export type FormError = {
  /** The id of the control this failure belongs to. The row links to it. */
  id: string
  message: ReactNode
}

type Props = {
  /** The failures of the last submit, in the order the fields appear. */
  errors: FormError[]
  /** Heading above the list. Defaults to the count in the current language. */
  title?: ReactNode
  className?: string
}

/* What a failed submit owes a user who is not looking at the whole form: a
 * count, and a route. Marking each field in place is enough for someone who can
 * see the page at once, and useless for a keyboard user in a scrolled form and
 * for a screen reader that has already moved past the fields. So the summary
 * takes focus on submit, states how many failures there are, and every row is a
 * link that puts the caret in the field it names (GOV.UK error summary).
 *
 * The focus move is keyed on the errors themselves, not on mount: a second
 * failed submit with a different set has to pull focus back, or the second
 * attempt is silent. */

/** The on-submit list of what the form rejected: focusable, counted, and each
 *  row links to its own field. Render it above the first field. 
 *
 * Copy: the title counts the problems and nothing else — "2 things need fixing".
 * Each row repeats the field's own error word for word, because a summary
 * that paraphrases sends the reader hunting for a message that does not
 * exist.
 */
export function ErrorSummary({ errors, title, className }: Props) {
  const { t } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)
  /* Generated, not fixed: two forms on one screen (a page form and a panel)
   * would otherwise share one id and the label would point at the wrong one. */
  const titleId = useId()
  const signature = errors.map((e) => e.id).join('|')

  useEffect(() => {
    if (!errors.length) return
    ref.current?.focus()
    /* Focus alone scrolls the nearest scroller, and inside a form card that is
     * the card — but only if the browser agrees the element is out of view.
     * Asking explicitly is what makes the summary visible when the submit was
     * pressed from the bottom of a long form. */
    ref.current?.scrollIntoView({ block: 'nearest' })
    /* The ids are the identity of this failure set: re-focusing on every render
     * would steal the caret while the user is fixing the first field. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature])

  if (!errors.length) return null

  const focusField = (id: string) => {
    const el = document.getElementById(id)
    if (!(el instanceof HTMLElement)) return
    el.focus()
    el.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }

  return (
    <div
      ref={ref}
      className={cn('error-summary', className)}
      tabIndex={-1}
      /* `alert` announces it the moment it appears, which is the moment the
       * user pressed the button and is waiting to hear what happened. */
      role="alert"
      aria-labelledby={titleId}
    >
      <h2 id={titleId} className="error-summary-title">
        {title ?? t('field.problemTitle', { count: errors.length })}
      </h2>
      <ul className="error-summary-list">
        {errors.map((e) => (
          <li key={e.id}>
            {/* A real anchor, so it is in the link list and the URL fragment
              * survives a copied link; the handler adds the focus the fragment
              * alone does not give a control that is not tabbable by id. */}
            <a
              href={`#${e.id}`}
              onClick={(event) => {
                event.preventDefault()
                focusField(e.id)
              }}
            >
              {e.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
