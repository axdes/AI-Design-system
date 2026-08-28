import './CheckboxGroup.css'
import { cn } from '../../lib/cn'
import { Checkbox } from './Checkbox'

type Option = { value: string; label: string; disabled?: boolean }

type Props = {
  /** The ticked values. */
  value: string[]
  onChange: (value: string[]) => void
  options: Option[]
  /** Accessible group label. A group of boxes with no name is a list of
   *  unrelated questions to a screen reader. */
  label: string
  /** The form rejected the group as a whole (nothing ticked in a required set). */
  invalid?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/* The multi-select twin of `<RadioGroup>`: several boxes, one value array, one
 * group name. Kept beside Checkbox because it is the same control, grouped —
 * and because a set of boxes hand-stacked in a screen is the version that
 * always ships without the group label. */

/** A labelled group of checkboxes over one value array. Reach for it whenever
 *  more than one box answers the same question. */
export function CheckboxGroup({ value, onChange, options, label, invalid, size, className }: Props) {
  const toggle = (v: string) =>
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])

  return (
    /* `group`, not `radiogroup`: several answers are legal here, and the
     * keyboard model is plain Tab per box rather than arrow keys across one. */
    <div className={cn('checkbox-group', className)} role="group" aria-label={label}>
      {options.map((o) => (
        <Checkbox
          key={o.value}
          value={o.value}
          size={size}
          invalid={invalid}
          checked={value.includes(o.value)}
          disabled={o.disabled}
          onChange={() => toggle(o.value)}
          label={o.label}
        />
      ))}
    </div>
  )
}
