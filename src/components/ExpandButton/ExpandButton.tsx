import './ExpandButton.css'
import { type ButtonHTMLAttributes, type Ref } from 'react'
import { cn } from '../../lib/cn'
import { Button } from '../Button'
import { Icon, type IconName } from '../Icon'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Forwarded to the underlying <button>. */
  ref?: Ref<HTMLButtonElement>
  /** Icon shown always (collapsed and expanded state). */
  icon: IconName
  /** Label shown when expanded (hover or active). */
  label: string
  /** Show a chevron indicating dropdown / disclosure. */
  withChevron?: boolean
  /** Force expanded state (for use inside open dropdowns). */
  expanded?: boolean
}

/**
 * A BRAND-FILLED ICON THAT GROWS ITS LABEL WHEN THE POINTER ARRIVES. At rest it
 * is a circle carrying one glyph; on hover, on focus and while `expanded` is
 * set it widens into a pill and the words appear. That is the whole component,
 * and it is for the ONE action a screen offers everywhere — new, add, ask —
 * where a full pill would take room on every screen it appears on.
 *
 * It is NOT a disclosure caret, whatever the name suggests: it does not rotate,
 * and `withChevron` adds a mark that appears WITH the label rather than turning.
 * A row that opens a panel below it is <Accordion>, and a menu is
 * <ButtonGroup menu>.
 * This description used to say "the chevron that opens and closes a row", which
 * described a component that was never here (2026-08-29).
 *
 * The label is the accessible name at every size, so the collapsed circle is
 * never an unnamed control.
 *
 * Copy: the label names what happens, not the direction — "Add a participant",
 * not "Expand".
 */
export function ExpandButton({ icon, label, withChevron, expanded, className, type = 'button', ref, ...rest }: Props) {
  /* IT IS A <Button>, and it used to only look like one. Until 2026-08-31 this
   * drew its own pill: the brand fill, the hover step, the radius and the
   * pointer, all retyped in its own stylesheet. What it did not retype was the
   * focus ring, the disabled state and the pressed step, so the one control in
   * this family that was not built on Button was also the only one a keyboard
   * user could not see. Composing gets all four for free and leaves this
   * stylesheet with the one thing that is actually its own: the reveal. */
  return (
    <Button
      ref={ref}
      type={type}
      className={cn('expand-button', className)}
      aria-label={label}
      data-expanded={expanded || undefined}
      {...rest}
    >
      <Icon name={icon} size="md" />
      <span className="expand-button-label">{label}</span>
      {withChevron && <Icon name="arrow_drop_down" size="md" className="expand-button-chevron" />}
    </Button>
  )
}
