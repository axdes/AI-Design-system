import './Chip.css'
import { type HTMLAttributes, type ReactNode, type Ref } from 'react'
import { cn } from '../../lib/cn'
import { Icon, type IconName } from '../Icon'
import { Tooltip } from '../Tooltip'

/** Same variants as Button. Default is `secondary` (subtle) since chips are
 *  usually shown in groups; pass `selected` for the toggled/active state. */
type Variant = 'secondary' | 'primary' | 'ghost' | 'destructive' | 'dark'
type Size = 'sm' | 'md' | 'lg'

/* Monolithic because a chip is one word with the affordances around it: what
 * it is, whether it is chosen, whether it can be pressed, and whether it can
 * be taken away — and the label of that removal, which is icon-only. */
type Props = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
  children: ReactNode
  /** Forwarded to the element this renders — the <button>, or the <span> of a
   *  data token. */
  ref?: Ref<HTMLElement>
  /** How much the chip is claiming. `secondary` (default) is a label; `primary` is the one that
   *  is selected or active; `ghost` is a chip on a busy surface; `destructive` marks something
   *  failing.
   */
  variant?: Variant
  /** Follows the row it sits in: `sm` inside a table cell or a dense toolbar, `md` on its own.
   *  Defaults to `md` as a control and `sm` as a data token, which is the size
   *  each was already shipping at. */
  size?: Size
  /** Toggled/active state for pick-one or multi-select chip groups (primary fill).
   *  A data token cannot be selected: there is nothing to press. */
  selected?: boolean
  /** Optional leading icon. */
  icon?: IconName
  /** IS THIS A CONTROL OR IS IT DATA? A control renders a <button> that answers
   *  hover, press and focus and is announced as pressed when `selected`. Data
   *  renders a <span> that does none of it: a value the reader typed or chose,
   *  which must never look pressable. Defaults to a control, and to data as
   *  soon as `onRemove` is given, because the X is then the only target. */
  interactive?: boolean
  /** Renders a trailing remove button that calls this on click. Data tokens
   *  only: a button inside a button is invalid HTML, so passing it makes the
   *  chip a token. */
  onRemove?: () => void
  /** Accessible label + tooltip for the remove button (required when removable). */
  removeLabel?: string
  disabled?: boolean
}

/**
 * The pill, in its two jobs. `interactive` (the default) is a control: a
 * Button with a toggle state, always pill-shaped — quick actions, quick
 * replies, pick-a-reason chips, filters. With `onRemove`, or with
 * `interactive={false}`, it is DATA: a static label token, the value as the
 * reader wrote or chose it, where only the trailing X does anything.
 *
 * One component because it was always one pill: <Tag> was a copy of this box
 * that swapped the element (2026-08-30). The element is the whole difference,
 * and it stays visible in the DOM — button or span — rather than being a flag
 * on a div.
 *
 * Copy: a control names the filter it applies, not the act of filtering —
 * "Overdue", not "Filter by overdue". A token is the value itself, unaltered:
 * rewording data makes it un-findable.
 */
export function Chip({
  variant = 'secondary',
  size,
  selected,
  icon,
  interactive,
  onRemove,
  removeLabel,
  disabled,
  className,
  children,
  ref,
  ...rest
}: Props) {
  const isControl = interactive ?? onRemove === undefined
  const resolvedSize = size ?? (isControl ? 'md' : 'sm')
  const glyph = icon && <Icon name={icon} />

  if (!isControl) {
    return (
      <span
        ref={ref}
        className={cn('chip', className)}
        data-variant={variant}
        data-size={resolvedSize}
        {...rest}
      >
        {glyph}
        <span className="chip-label">{children}</span>
        {onRemove && (
          <Tooltip content={removeLabel ?? ''}>
            <button type="button" className="chip-remove" aria-label={removeLabel} onClick={onRemove}>
              <Icon name="close" />
            </button>
          </Tooltip>
        )}
      </span>
    )
  }

  return (
    <button
      ref={ref as Ref<HTMLButtonElement>}
      type="button"
      className={cn('chip', className)}
      data-variant={variant}
      data-size={resolvedSize}
      data-selected={selected || undefined}
      aria-pressed={selected}
      disabled={disabled}
      {...rest}
    >
      {glyph}
      {children}
    </button>
  )
}
