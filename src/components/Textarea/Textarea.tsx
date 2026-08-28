import '../Input/Input.css'
import './Textarea.css'
import type { TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type Props = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> & {
  /** The field failed validation. A STATE, not a style: it sets `aria-invalid`,
   *  which is what ties the error message `<Field>` renders to this control. */
  invalid?: boolean
  /** Which surface it stands on — the same question `<Input>` answers, and it
   *  had no way to answer it: this wears `.input`, so the muted styling was
   *  already there and only the prop was missing. A textarea beside an input on
   *  the same card could not match it (2026-08-28). `muted` drops the border,
   *  because the fill separates it there; `base` (default) keeps it. */
  surface?: 'base' | 'muted'
  /** sm / md (default) / lg — matches the control scale (font + min-height). */
  size?: 'sm' | 'md' | 'lg'
}

/* Multi-line counterpart to <Input> — reuses the `.input` field styling
 * (border, radius, focus ring, hover, placeholder) and only overrides the
 * height/resize behaviour. */
export function Textarea({ invalid, size, surface = 'base', className, rows = 4, ...rest }: Props) {
  return (
    <textarea
      className={cn('input', 'textarea', className)}
      data-size={size}
      data-surface={surface}
      aria-invalid={invalid || undefined}
      rows={rows}
      {...rest}
    />
  )
}
