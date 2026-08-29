import { type ReactNode } from 'react'
import { Button } from '../Button'
import { ButtonGroup } from '../ButtonGroup'
import { Dropdown } from '../Dropdown'
import { Icon } from '../Icon'
import { IconButton } from '../IconButton'
import { Tooltip } from '../Tooltip'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'sm' | 'md' | 'lg'
type Align = 'start' | 'end'

type Props = {
  /** What the button says. */
  label: ReactNode
  /** The menu: `<DropdownItem>`, `<DropdownSection>`, `<DropdownDivider>`. */
  children: ReactNode
  /**
   * The default action, lifted out of the menu onto its own half. Give it and
   * the control SPLITS: the label does the common thing on one press, the
   * chevron offers the alternatives. Leave it out and the whole button opens
   * the menu, because a button that promotes nothing should not look like it
   * promotes something.
   */
  onClick?: () => void
  /**
   * Names the half that is only a chevron, and the pair as a whole. Required
   * with `onClick` for the reason `IconButton` exists: an icon with no words is
   * unreachable by anyone who cannot see it. Without `onClick` the label
   * already names the control and this is not read.
   */
  menuLabel?: string
  /** The same rule as any button: `primary` for the one action the screen is for, `secondary`
   *  for a real action that is not that one, `ghost` where a filled pill would shout.
   */
  variant?: Variant
  /** Follows the row it sits in, and both halves take it: `sm` in a toolbar or a card header,
   *  `md` in the page's own action row.
   */
  size?: Size
  /** Which edge of the trigger the menu lines up with. */
  align?: Align
  className?: string
}

/**
 * A button that opens a MENU, in its two forms: one target that opens the menu,
 * or — with `onClick` — a split button whose label commits the default action
 * and whose chevron opens the rest.
 *
 * It exists because the system had neither form and both were being assembled
 * by hand in eight places (2026-08-26): the render-prop trigger, the chevron,
 * `data-open`, and — the part that breaks silently — an `aria-label` on the
 * half that is only an icon. One part, so the boilerplate is written once and
 * the accessible name cannot be forgotten.
 *
 * It takes NO leading icon, and that is the system's rule rather than a gap:
 * `.btn > .icon` carries `order: 1`, so every mark in a button trails its label
 * (owner's ruling). A menu button already spends that slot on the chevron, and
 * a second mark could only pile up beside it — "Create ＋ ⌄" reads as two
 * controls stuck together. One button, one mark, and it is the one that says a
 * menu opens.
 *
 * Reach for <Dropdown> directly when the trigger is not a button (an avatar, a
 * table row) and for <ContextMenu> when the menu belongs to a right-click.
 *
 * Copy: the label is the verb of the default action when there is one, and the
 * menu items are the other ways to do it — parallel with the label, so the
 * set reads as one decision.
 */
export function MenuButton({
  label,
  children,
  onClick,
  menuLabel,
  variant = 'primary',
  size = 'md',
  align = 'end',
  className,
}: Props) {
  /* One control: the whole button is the trigger, and the chevron is part of
     its label rather than a second target. */
  if (!onClick) {
    return (
      <Dropdown
        align={align}
        className={className}
        trigger={({ isOpen, ...triggerProps }) => (
          <Button variant={variant} size={size} data-open={isOpen || undefined} {...triggerProps}>
            {label}
            <Icon name="arrow_drop_down" />
          </Button>
        )}
      >
        {children}
      </Dropdown>
    )
  }

  /* Two controls welded into one pill. <ButtonGroup> owns the seam; the tone it
     is told is the one the halves carry, so the divider is a step of the same
     colour rather than a grey line across a brand button. */
  const name = menuLabel ?? `${typeof label === 'string' ? label : 'More'} options`
  return (
    <ButtonGroup label={name} tone={variant === 'primary' ? 'primary' : 'neutral'} className={className}>
      <Button variant={variant} size={size} onClick={onClick}>
        {label}
      </Button>
      <Dropdown
        align={align}
        trigger={({ isOpen, ...triggerProps }) => (
          <Tooltip content={name}>
            <IconButton
              icon="arrow_drop_down"
              size={size}
              variant={variant === 'ghost' ? 'ghost' : 'filled'}
              tone={variant === 'primary' ? 'primary' : undefined}
              aria-label={name}
              data-open={isOpen || undefined}
              {...triggerProps}
            />
          </Tooltip>
        )}
      >
        {children}
      </Dropdown>
    </ButtonGroup>
  )
}
