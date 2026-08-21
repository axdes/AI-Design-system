import './ExpandButton.css'
import { type ButtonHTMLAttributes, type Ref } from 'react'
import { cn } from '../../lib/cn'
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
 * The chevron that opens and closes a row or a panel, with the rotation and
 * the aria-expanded wiring already done.
 */
export function ExpandButton({ icon, label, withChevron, expanded, className, type = 'button', ref, ...rest }: Props) {
  return (
    <button
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
    </button>
  )
}
