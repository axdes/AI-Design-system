import '../Input/Input.css'
import './TimeInput.css'
import type { ComponentPropsWithRef } from 'react'
import { cn } from '../../lib/cn'

type Props = Omit<ComponentPropsWithRef<'input'>, 'size' | 'type' | 'value' | 'onChange'> & {
  /** 24-hour "HH:MM" (the native time value). Empty string = not set yet. */
  value?: string
  onChange?: (value: string) => void
  invalid?: boolean
  /** Which surface the field sits on; same contract as <Input>. */
  surface?: 'base' | 'muted'
  /** Control height: sm / md (default) / lg — matches the button/control scale. */
  size?: 'sm' | 'md' | 'lg'
}

/* A time-of-day field: the native <input type="time"> in the system's Input
 * clothes, so the picker, the validation and the keyboard stay the browser's.
 * The value is always 24-hour "HH:MM"; the browser shows it in the user's own
 * clock convention. Wrap it in <Field> for its label, like <Input>. */
export function TimeInput({ value, onChange, invalid, surface = 'base', size, className, ...rest }: Props) {
  return (
    <input
      type="time"
      className={cn('input', 'timeinput', className)}
      data-size={size}
      data-surface={surface}
      aria-invalid={invalid || undefined}
      value={value}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      {...rest}
    />
  )
}
