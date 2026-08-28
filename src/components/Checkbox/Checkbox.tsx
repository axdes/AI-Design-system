import './Checkbox.css'
import type { InputHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'
import { Icon } from '../Icon'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> & {
  /** Visible label beside the box. */
  label?: string
  /** Mixed state (e.g. "select all" when only some children are checked). */
  indeterminate?: boolean
  /** Box size: sm / md (default) / lg. */
  size?: 'sm' | 'md' | 'lg'
  /** The form rejected this box (an unticked required consent). Red border and
   *  a red focus ring; the message belongs to the `<Field>` around it. */
  invalid?: boolean
}

/* Custom checkbox: a real <input> (kept accessible + form-native) visually
 * replaced by a themed box. Sizing/colors come from tokens, like the controls. 
   *
   * Copy: the label is the positive statement the tick makes true — "Send me the
   * weekly digest", never "Do not send…". A negative label makes an unticked
   * box mean yes.
   */
export function Checkbox({ label, indeterminate = false, size, invalid, className, disabled, ...rest }: Props) {
  return (
    <label
      className={cn('checkbox', className)}
      data-size={size}
      data-disabled={disabled || undefined}
      data-invalid={invalid || undefined}
    >
      <input
        ref={(el) => { if (el) el.indeterminate = indeterminate }}
        type="checkbox"
        className="checkbox-input"
        disabled={disabled}
        aria-invalid={invalid || undefined}
        {...rest}
      />
      <span className="checkbox-box" aria-hidden="true"><Icon name="check" /></span>
      {label && <span className="checkbox-label">{label}</span>}
    </label>
  )
}
