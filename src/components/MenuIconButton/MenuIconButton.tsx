import { type ReactNode } from 'react'
import { Dropdown } from '../Dropdown'
import { type IconName } from '../Icon'
import { IconButton } from '../IconButton'
import { Tooltip } from '../Tooltip'

type Variant = 'ghost' | 'filled' | 'quiet'
type Size = 'sm' | 'md' | 'lg'
type Align = 'start' | 'end'

type Props = {
  /**
   * What the control is called. It is the accessible name AND the tooltip —
   * required, because a lone glyph names nothing and this is the shape where
   * that is forgotten. "More actions" is not it: say whose actions.
   */
  label: string
  /** The menu: `<DropdownItem>`, `<DropdownSection>`, `<DropdownDivider>`. */
  children: ReactNode
  /** Defaults to the overflow glyph, which is what this nearly always is. */
  icon?: IconName
  variant?: Variant
  size?: Size
  /** Which edge of the trigger the menu lines up with. */
  align?: Align
  className?: string
}

/**
 * A MENU behind a single glyph: the row's `⋮`, the card's overflow, the extra
 * actions a toolbar has no room to name.
 *
 * It is <MenuButton>'s pair, and the split between them is the same one the
 * system already makes between `Button` and `IconButton`: a control with no
 * words in it has to carry a name and a tooltip, and a separate component is
 * what makes that unavoidable rather than remembered. Folding it into
 * MenuButton as an optional label would make the name optional, which is the
 * whole thing this prevents.
 *
 * Built 2026-08-26, after four screens assembled it by hand from a Dropdown
 * render prop, an IconButton and an aria-label.
 *
 * Copy: the label names WHOSE actions these are — "Actions for the March
 * invoice" — because "More actions" on six rows tells a screen-reader user
 * nothing about which row they are on.
 */
export function MenuIconButton({
  label,
  children,
  icon = 'more_vert',
  variant = 'ghost',
  size = 'md',
  align = 'end',
  className,
}: Props) {
  return (
    <Dropdown
      align={align}
      className={className}
      trigger={({ isOpen, ...triggerProps }) => (
        <Tooltip content={label}>
          <IconButton
            icon={icon}
            size={size}
            variant={variant}
            aria-label={label}
            data-open={isOpen || undefined}
            {...triggerProps}
          />
        </Tooltip>
      )}
    >
      {children}
    </Dropdown>
  )
}
