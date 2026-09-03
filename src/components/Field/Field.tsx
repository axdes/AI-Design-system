import './Field.css'
import { Children, cloneElement, isValidElement, useId, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/cn'
import { Label } from '../Label'

type Props = {
  /** What the control is asking for, in the reader's words. Required, and it is
   *  the field's whole reason to exist: a control with no label announces only
   *  its current value, so a screen reader hears "Annual leave" and never learns
   *  what question that answers. */
  label: ReactNode
  /** Links the label to a control id (for native inputs/textarea). */
  htmlFor?: string
  /** Marks the field as required, to the reader and to the control. Use it when
   *  most of the form is optional; when most of it is required, mark the few
   *  that are not with `optional` instead. */
  required?: boolean
  /** Marks the MINORITY. In a form where most fields are required, the few that
   *  are not say so; a star on every field tells nobody anything. */
  optional?: boolean
  /** Validation message, above the control. Announced, and described-by wired. */
  error?: ReactNode
  /** Quiet hint above the control, replaced by `error` when there is one. */
  hint?: ReactNode
  /** The one thing that belongs UNDER the control: a `<CharacterCount>`, which
   *  is a running total of what was typed rather than an instruction. */
  /* `counter`, not `count`: everywhere else in the system a `count` is the
   * NUMBER of something, and this is the part that displays one. (2026-09-03) */
  counter?: ReactNode
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
 * it depends on its role (a `<button>` trigger cannot), so each control decides.
 *
 * Message ABOVE the control (2026-08-23, GOV.UK order): an instruction read
 * after typing is not an instruction, and on a magnified viewport a message
 * under the control is off screen while the control is being used. The order is
 * label, message, control, and it is the same order in both cases so a field
 * does not reflow when it fails. */

/** Form field: a label (with optional required marker), the hint or error, then
 *  its control, wired together with `aria-describedby`. 
 *
 * Copy: the label names the value, not the input — "Work email", not "Enter your
 * email". The hint is a rule that applies before typing; the error is what
 * happened and what to do — "Add a country code", never "Invalid".
 */
export function Field({ label, htmlFor, required, optional, error, hint, counter, children, className }: Props) {
  const { t } = useTranslation()
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
    <div className={cn('field', className)} data-invalid={error ? '' : undefined}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="field-required" aria-hidden="true"> *</span>}
        {/* Not aria-hidden, unlike the star: "optional" is information the
          * required marker's absence cannot carry to a screen reader. */}
        {optional && !required && <span className="field-optional"> {t('field.optional')}</span>}
      </Label>
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
      {control}
      {counter}
    </div>
  )
}
