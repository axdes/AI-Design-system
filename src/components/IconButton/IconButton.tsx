import './IconButton.css'
import { type ButtonHTMLAttributes, type Ref } from 'react'
import { cn } from '../../lib/cn'
import { Icon, type IconName } from '../Icon'
import { Spinner } from '../Spinner'

type Size = 'sm' | 'md' | 'lg'
type Variant = 'ghost' | 'filled' | 'quiet'
type Tone = 'primary' | 'destructive'

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  /** Forwarded to the underlying <button>. */
  ref?: Ref<HTMLButtonElement>
  icon: IconName
  /** Square button matching control heights: sm 32 / md 40 / lg 52. Default 'sm'.
   *  NOTE: `Button` defaults to 'md', so a pair of them needs this stated — an
   *  unsized icon button beside an unsized button is 32 next to 40. Three apps
   *  shipped that before `controls-same-height` started asking. */
  size?: Size
  /** ghost = transparent (default, hover = accent fill). filled = solid fill.
   *  quiet = transparent, hover recolors only (no fill) — for inline toolbar icons. */
  variant?: Variant
  /** Fill colour for `filled` (e.g. send = primary, stop = destructive). */
  tone?: Tone
  /** Hidden by default; container's :hover or `data-open` makes it visible. */
  reveal?: boolean
  /** In-flight action: swaps the icon for a spinner and blocks clicks. The
   *  spinner reuses the button's aria-label as its accessible name. */
  loading?: boolean
}

/* THE GLYPH IS THE CONTENT, so it scales with the button: 32 holds 16, 40 holds
 * 20, 52 holds 24.
 *
 * This reverses the 2026-08-22 answer, and the reason that answer was reached
 * still stands as an observation: a 40px `Button` holds a 16px icon, so a 40px
 * icon button holding 20px looked like two different icons at one control
 * height. The conclusion was wrong. An icon BESIDE a label is an accessory and
 * takes the small size; an icon-only button has no label, so the glyph is the
 * whole thing being pointed at. Shrinking it to match the accessory left a
 * 16px mark floating in 40px of nothing, which the owner reported twice
 * (2026-08-23) as "why are the icons so small". The two cases are different
 * cases, and one rule for both was the error.
 *
 * The superseded reasoning, kept because it is the half that is still true:
 * --icon-sm is what this system puts in a control BESIDE TEXT. That rule is
 * untouched; it simply never applied here. */
const GLYPH = { sm: 'sm', md: 'md', lg: 'lg' } as const

/**
 * A button whose label is an icon, which is why it always takes an aria-label
 * and a Tooltip. `quiet` for inline toolbars, `filled` plus `tone` for send
 * and stop.
 *
 * Copy: the aria-label is the same verb a worded button would carry, and it
 * names the target when a screen repeats the control: "Delete invoice
 * INV-1041", not "Delete".
 */
export function IconButton({
  icon, size = 'sm', variant, tone, reveal, loading, disabled, className, type = 'button', ref, ...rest
}: Props) {
  const label = rest['aria-label']
  return (
    <button
      ref={ref}
      type={type}
      className={cn('icon-button', className)}
      data-size={size}
      data-variant={variant}
      data-tone={tone}
      data-reveal={reveal || undefined}
      data-loading={loading || undefined}
      disabled={disabled || loading || undefined}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner size={GLYPH[size]} label={label ?? 'Loading'} /> : <Icon name={icon} size={GLYPH[size]} />}
    </button>
  )
}
