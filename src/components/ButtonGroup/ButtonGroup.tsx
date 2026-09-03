import './ButtonGroup.css'
import { type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { Button } from '../Button'
import { Dropdown } from '../Dropdown'
import { Icon } from '../Icon'
import { IconButton } from '../IconButton'
import { Tooltip } from '../Tooltip'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'sm' | 'md' | 'lg'
type Align = 'start' | 'end'

/* ONE PROP PAINTS EVERY FILL THIS COMPONENT DRAWS ITSELF: the single button, the
 * chevron half, and (through the CSS) the seam between the halves. It used to be
 * two props on two components — `variant` on the menu button, `tone` on the
 * group — which meant a split primary action had to be told twice and could be
 * told inconsistently. */
const CHEVRON: Record<Variant, { variant: 'filled' | 'ghost'; tone?: 'primary' }> = {
  secondary: { variant: 'filled' },
  primary: { variant: 'filled', tone: 'primary' },
  ghost: { variant: 'ghost' },
}

type Props = {
  /**
   * The halves: `<Button>`s or `<IconButton>`s, two or three. Past that it is a
   * toolbar, not one control. Leave them out and `menu` gives you a single
   * button that opens the menu, which is the form to reach for when the options
   * are peers and none of them is the usual answer.
   */
  children?: ReactNode
  /**
   * What the control is called. With halves it is the announced name for the
   * pair, which otherwise reaches a screen reader as two controls with nothing
   * tying them together. With none it is ALSO the visible text, because then
   * there is nothing else to read.
   */
  label: string
  /**
   * The menu: `<DropdownItem>`, `<DropdownSection>`, `<DropdownDivider>`. Given
   * it, a menu is welded onto the end — as its own chevron half when there are
   * halves, and as the whole button when there are none.
   */
  menu?: ReactNode
  /**
   * Names the half that is only a chevron, and it cannot be nameless: an icon
   * with no words is unreachable by anyone who cannot see it. Defaults to
   * `label`, which is why forgetting it is not a bug you can ship.
   */
  menuLabel?: string
  /**
   * The weight this control carries ON THE SCREEN, and the one decision behind
   * every fill here: the seam between the halves, the single button's fill and
   * the chevron half's. `primary` for the one action the screen is for and a
   * screen has one, `secondary` for a real action that is not that one, `ghost`
   * where a filled pill would shout — a toolbar, a card header, a row. It is
   * the same word, meaning the same thing, that every half you pass takes.
   */
  variant?: Variant
  /**
   * Control height for the parts THIS component renders (the single button, the
   * chevron half). Halves you pass carry their own `size`, and they have to
   * agree: `IconButton` defaults to sm and `Button` to md, so an unsized pair
   * renders 32px beside 40px.
   */
  size?: Size
  /**
   * Which edge the menu lines up with, and it follows where the control SITS
   * rather than taste. The default `end` is right for a control on the right of
   * its container, which is where actions usually are; `start` when it is on the
   * left, so the menu opens into the page instead of off its edge.
   */
  align?: Align
  className?: string
}

/**
 * ONE CONTROL MADE OF MORE THAN ONE PART: buttons welded into a single pill, a
 * menu welded onto the end, or both. The radii flatten where the parts meet and
 * a hairline separates them, because a gap says "two things" — a row of buttons
 * with space between them is a row of buttons, and `<Layout direction="row">`
 * already builds that.
 *
 * Three forms, and the props choose between them rather than three components
 * doing it:
 *
 * - `menu` alone — one button that opens the menu. For options that are peers,
 *   where none of them is the usual answer: "Create" is not an action, it is a
 *   question about what to create.
 * - `menu` with halves — a split control. The common action keeps its own half
 *   at one press and the alternatives stay one press away. Promote something
 *   only when it really is what people pick; a promoted half that is usually
 *   wrong makes the common case two presses and looks like a misfire.
 * - halves alone — a welded pair with no menu.
 *
 * It was two components until 2026-08-31, `ButtonGroup` and `MenuButton`, and
 * the second was built on the first. Reach for `<MenuIconButton>` when the whole
 * control is one glyph, and for `<Dropdown>` when the trigger is not a button at
 * all (an avatar, a table row).
 *
 * Copy: the label says what the control decides — "Save options" — and the menu
 * items keep the verb of the half beside them, so the set reads as more ways to
 * do the one thing.
 */
export function ButtonGroup({
  children, label, menu, menuLabel, variant = 'secondary', size = 'md', align = 'end', className,
}: Props) {
  /* ONE TARGET, because nothing was promoted: the whole button opens the menu
     and the chevron is part of its label rather than a second control. No group
     either — a group of one announces a container that is not there. */
  if (menu && !children) {
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
        {menu}
      </Dropdown>
    )
  }

  /* Welded into one pill. The CSS owns the seam; `data-variant` tells it which
     ink to draw it in, so a split primary action is divided by a darker step of
     the brand rather than by a grey line across it. */
  const chevron = menuLabel ?? label
  return (
    <div className={cn('button-group', className)} data-variant={variant} role="group" aria-label={label}>
      {children}
      {menu && (
        <Dropdown
          align={align}
          trigger={({ isOpen, ...triggerProps }) => (
            <Tooltip content={chevron}>
              <IconButton
                icon="arrow_drop_down"
                size={size}
                variant={CHEVRON[variant].variant}
                tone={CHEVRON[variant].tone}
                aria-label={chevron}
                data-open={isOpen || undefined}
                {...triggerProps}
              />
            </Tooltip>
          )}
        >
          {menu}
        </Dropdown>
      )}
    </div>
  )
}
