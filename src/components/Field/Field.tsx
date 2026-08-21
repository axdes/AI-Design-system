import './Field.css'
import { Children, cloneElement, isValidElement, useId, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { Label } from '../Label'

type Props = {
  label: ReactNode
  /** Links the label to a control id (for native inputs/textarea). */
  htmlFor?: string
  required?: boolean
  /** Validation message under the control. Announced, and described-by wired. */
  error?: ReactNode
  /** Quiet hint under the control, replaced by `error` when there is one. */
  hint?: ReactNode
  children: ReactNode
  className?: string
}

/* Why the wiring lives here and not in each screen: a red border tells a sighted
 * user something is wrong and tells everyone else nothing, and a message rendered
 * as a loose <p> under the control is not connected to it — a screen reader
 * reaches the field, says nothing, and the explanation turns up later as an
 * unrelated sentence. `aria-describedby` is what joins them, and it needs an id
 * both sides agree on, so one component has to own both ends.
 *
 * Found missing while correcting `<Select invalid>`, whose prop documentation
 * promised an announcement that nothing in the system could make.
 *
 * `aria-invalid` is deliberately NOT set from here: whether a control can carry
 * it depends on its role (a `<button>` trigger cannot), so each control decides. */

/** Form field: a label (with optional required marker) over its control, plus the
 *  hint or error underneath, wired to the control with `aria-describedby`. */
export function Field({ label, htmlFor, required, error, hint, children, className }: Props) {
  const messageId = useId()
  const message = error ?? hint
  const describedBy = message ? messageId : undefined

  /* Attach the description to the control itself when there is exactly one
   * element to attach it to. Several children, or a bare string, means the caller
   * composed something custom and owns the wiring. */
  const only = Children.count(children) === 1 ? Children.only(children) : null
  let control = children
  if (describedBy && isValidElement<{ 'aria-describedby'?: string }>(only)) {
    /* Merged, not replaced: a control may already point at something of its own. */
    const existing = only.props['aria-describedby']
    control = cloneElement(only, { 'aria-describedby': existing ? `${existing} ${describedBy}` : describedBy })
  }

  return (
    <div className={cn('field', className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="field-required" aria-hidden="true"> *</span>}
      </Label>
      {control}
      {message && (
        <p
          id={messageId}
          className="field-message"
          data-error={error ? '' : undefined}
          /* An error appears in response to something the user just did, so it is
             announced; a hint is there from the start and must not interrupt. */
          role={error ? 'alert' : undefined}
        >
          {message}
        </p>
      )}
    </div>
  )
}
