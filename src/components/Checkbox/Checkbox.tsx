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
}

/* Custom checkbox: a real <input> (kept accessible + form-native) visually
 * replaced by a themed box. Sizing/colors come from tokens, like the controls. */
export function Checkbox({ label, indeterminate = false, size, className, disabled, ...rest }: Props) {
  return (
    <label className={cn('checkbox', className)} data-size={size} data-disabled={disabled || undefined}>
      <input
        ref={(el) => { if (el) el.indeterminate = indeterminate }}
        type="checkbox"
        className="checkbox-input"
        disabled={disabled}
        {...rest}
      />
      <span className="checkbox-box" aria-hidden="true"><Icon name="check" /></span>
      {label && <span className="checkbox-label">{label}</span>}
    </label>
  )
}
