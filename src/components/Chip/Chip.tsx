import './Chip.css'
import { type ButtonHTMLAttributes, type Ref } from 'react'
import { cn } from '../../lib/cn'
import { Icon, type IconName } from '../Icon'

/** Same variants as Button. Default is `secondary` (subtle) since chips are
 *  usually shown in groups; pass `selected` for the toggled/active state. */
type Variant = 'secondary' | 'primary' | 'ghost' | 'destructive' | 'dark'
type Size = 'sm' | 'md' | 'lg'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Forwarded to the underlying <button>. */
  ref?: Ref<HTMLButtonElement>
  variant?: Variant
  size?: Size
  /** Toggled/active state for pick-one or multi-select chip groups (primary fill). */
  selected?: boolean
  /** Optional leading icon. */
  icon?: IconName
}

/* Rounded selectable label. A Button with a toggle state, always pill-shaped:
 * quick actions, quick replies, pick-a-reason chips, filters, etc. */
export function Chip({ variant = 'secondary', size = 'md', selected, icon, className, type = 'button', children, ref, ...rest }: Props) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn('chip', className)}
      data-variant={variant}
      data-size={size}
      data-selected={selected || undefined}
      aria-pressed={selected}
      {...rest}
    >
      {icon && <Icon name={icon} />}
      {children}
    </button>
  )
}
