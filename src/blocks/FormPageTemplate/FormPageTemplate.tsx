import './FormPageTemplate.css'
import { type ReactNode } from 'react'
import { Button } from '../../components/Button'
import { ErrorSummary, type FormError } from '../../components/ErrorSummary'
import { Page } from '../Page'
import { cn } from '../../lib/cn'
import { useUnsavedChanges } from '../../lib/useUnsavedChanges'

type Props = {
  /** Page title in the header. */
  title?: ReactNode
  /** What the last submit rejected. Rendered above the first field, and it
   *  takes focus, so a failed submit is never silent. */
  errors?: FormError[]
  /** The `<FormSection>` stack, or a plain `<FormStack>` for a short form. */
  children?: ReactNode
  /** Names the real event ("Create workspace"), never "Submit". */
  /* ReactNode: the same word means the same shape everywhere in this system,
   * and its neighbours already took one. Widened 2026-09-03; it is rendered
   * as content here, never put in an attribute. */
  submitLabel: ReactNode
  onSubmit: () => void
  /* ReactNode: the same word means the same shape everywhere in this system,
   * and its neighbours already took one. Widened 2026-09-03; it is rendered
   * as content here, never put in an attribute. */
  cancelLabel?: ReactNode
  /** Omit for a form nobody cancels out of (an autosaving draft). */
  onCancel?: () => void
  /** Submitting: the primary carries the spinner, the rest disables. */
  busy?: boolean
  /** The `<SaveStatus>` of an autosaving form, beside the actions. */
  status?: ReactNode
  /** True once a field has been edited. While it is true, closing the tab asks
   *  first: an explicit-save form that loses work silently is the one complaint
   *  no error message can answer afterwards. */
  dirty?: boolean
  className?: string
}

/**
 * The page-sized FORM skeleton: a capped column of `<FormSection>`s under the
 * page header, the error summary above the first field, and the actions pinned
 * in a footer bar so the commit is reachable without scrolling to the bottom.
 * Reach for it past six fields or as soon as the form has named sections; below
 * that a form in a `<Modal>` does the same job without a route change.
 *
 * Copy: the title names what is being created or changed, and the submit label
 * repeats that verb — "Create invoice", not "Submit". Cancel says what is
 * lost when the reader means to keep it.
 */
export function FormPageTemplate({
  title,
  errors,
  children,
  submitLabel,
  onSubmit,
  cancelLabel = 'Cancel',
  onCancel,
  busy,
  status,
  dirty,
  className,
}: Props) {
  useUnsavedChanges(Boolean(dirty))
  return (
    /* The page geometry is the `form` archetype's: the SURFACE takes the page
     * width and only the field column inside it is capped, which is the
     * correction page-rules.json now records. `panels` releases the shell's
     * height so the form scrolls inside its own card. */
    <Page archetype="form" panels className={cn('form-page-shell', className)} title={title}>
      {/* A real <form>: Enter submits from any field, the browser's own
        * required/type handling still applies, and a screen reader announces
        * the region as a form rather than as a stack of controls. */}
      {/* The form IS a surface, the way a panelled detail page is: white card,
        * its own scroll, and the actions pinned to the BOTTOM OF THE CARD rather
        * than floating over the page. `data-panels` on the shell above is what
        * releases the app shell's height for it (see AppLayout.css). */}
      <form
        className="form-page"
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit()
        }}
      >
        <div className="form-page-body">
          {errors && errors.length > 0 && <ErrorSummary errors={errors} />}
          {children}
        </div>
        <div className="form-page-actions">
          <div className="form-page-actions-inner">
            {status}
            <div className="form-page-buttons">
              {onCancel && (
                <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>
                  {cancelLabel}
                </Button>
              )}
              {/* Never disabled by validity: a dead button with no explanation
                * is a dead end, so the submit runs and answers with the summary. */}
              <Button type="submit" variant="primary" loading={busy}>
                {submitLabel}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Page>
  )
}
