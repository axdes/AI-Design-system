import './NumberInput.css'
import { type InputHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'
import { IconButton } from '../IconButton'
import { Tooltip } from '../Tooltip'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange' | 'min' | 'max' | 'step'> & {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  /** Accessible name (there is no visible label; wrap in <Field> for one). */
  label: string
  /** A STATE, not a style: it turns the border and hands <Field> the hook it needs to read the
   *  error out as part of the field.
   */
  invalid?: boolean
  /** Which surface the field sits on. On `muted` (a page/PageHeader) the border
   *  is dropped since the white fill separates it; `base` (default, a white card
   *  or form) keeps the border. Invalid + focus stay visible on both. */
  surface?: 'base' | 'muted'
  /** sm / md (default) / lg — matches the shared control height/padding scale. */
  size?: 'sm' | 'md' | 'lg'
  decrementLabel?: string
  incrementLabel?: string
}

/* A number field with stepper buttons. The native <input type="number"> keeps
 * the spinbutton role, keyboard and validation; the -/+ buttons are the
 * click affordance. Clamps to min/max. Wrap in <Field> for a visible label. 
   *
   * Copy: the label carries the unit, so the number never has to — "Weight in kg",
   * not "Weight" with a kg inside the box.
   */
export function NumberInput({
  value, onChange, min, max, step = 1, label, invalid, disabled,
  decrementLabel = 'Decrease', incrementLabel = 'Increase', surface = 'base', size, className, ...rest
}: Props) {
  const clamp = (n: number) => {
    if (min !== undefined && n < min) return min
    if (max !== undefined && n > max) return max
    return n
  }
  const atMin = min !== undefined && value <= min
  const atMax = max !== undefined && value >= max
  /* Steppers scale with the field: sm/md field uses sm buttons, lg uses md. */
  const stepperSize = size === 'lg' ? 'md' : 'sm'

  return (
    <div className={cn('number-input', className)} data-invalid={invalid || undefined} data-disabled={disabled || undefined} data-surface={surface} data-size={size}>
      <Tooltip content={decrementLabel}>
        <IconButton
          icon="remove"
          size={stepperSize}
          variant="quiet"
          aria-label={decrementLabel}
          disabled={disabled || atMin}
          onClick={() => onChange(clamp(value - step))}
        />
      </Tooltip>
      <input
        type="number"
        className="number-input-field"
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        aria-label={label}
        aria-invalid={invalid || undefined}
        onChange={(e) => { const n = Number(e.target.value); if (!Number.isNaN(n)) onChange(clamp(n)) }}
        {...rest}
      />
      <Tooltip content={incrementLabel}>
        <IconButton
          icon="add"
          size={stepperSize}
          variant="quiet"
          aria-label={incrementLabel}
          disabled={disabled || atMax}
          onClick={() => onChange(clamp(value + step))}
        />
      </Tooltip>
    </div>
  )
}
