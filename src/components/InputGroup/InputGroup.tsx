import './InputGroup.css'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Props = {
  /** Exactly one field — an `<Input>`, `<NumberInput>` or `<Textarea>`. */
  children: ReactNode
  /** Sits before the value: a unit, a scheme, a currency. Text, or a control. */
  prefix?: ReactNode
  /** Sits after it: a unit, a Button, an IconButton. */
  suffix?: ReactNode
  /** Red frame + red focus ring. The message belongs to the `<Field>` around it. */
  invalid?: boolean
  /** Dims the affixes with the control inside, so the group reads as one disabled field rather
   *  than a live frame around a dead input.
   */
  disabled?: boolean
  /** Which surface the group sits on — same contract as `<Input surface>`. */
  surface?: 'base' | 'muted'
  /** Matches the control inside it; the affixes follow. A group one step off its input reads as
   *  two parts that met by accident.
   */
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * A field with something attached to it: `https://` before the value, `kg`
 * after it, a Copy button on the end. The GROUP wears the field frame and owns
 * the focus ring; the input inside goes frameless, so the whole thing reads and
 * behaves as one control rather than a box beside a box.
 */
export function InputGroup({
  children, prefix, suffix, invalid, disabled, surface = 'base', size, className,
}: Props) {
  return (
    <div
      className={cn('input-group', className)}
      data-size={size}
      data-surface={surface}
      data-invalid={invalid || undefined}
      data-disabled={disabled || undefined}
    >
      {prefix !== undefined && <span className="input-group-affix" data-side="start">{prefix}</span>}
      {children}
      {suffix !== undefined && <span className="input-group-affix" data-side="end">{suffix}</span>}
    </div>
  )
}
