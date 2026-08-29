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
  /** How much the chip is claiming. `secondary` (default) is a label; `primary` is the one that
   *  is selected or active; `ghost` is a chip on a busy surface; `destructive` marks something
   *  failing.
   */
  variant?: Variant
  /** Follows the row it sits in: `sm` inside a table cell or a dense toolbar, `md` on its own. */
  size?: Size
  /** Toggled/active state for pick-one or multi-select chip groups (primary fill). */
  selected?: boolean
  /** Optional leading icon. */
  icon?: IconName
}

/* Rounded selectable label. A Button with a toggle state, always pill-shaped:
 * quick actions, quick replies, pick-a-reason chips, filters, etc. 
   *
   * Copy: names the filter it applies, not the act of filtering — "Overdue", not
   * "Filter by overdue".
   */
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
