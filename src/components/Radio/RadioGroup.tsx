import './Radio.css'
import { Radio } from './Radio'

type Option<T extends string> = { value: T; label: string; disabled?: boolean }

type Props<T extends string> = {
  /** Shared input name (groups the radios for keyboard nav + single selection). */
  name: string
  value: T
  onChange: (value: T) => void
  options: Option<T>[]
  /** Accessible group label (for screen readers). */
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

/* A set of radios sharing one name. Native radios handle arrow-key navigation. */
export function RadioGroup<T extends string>({ name, value, onChange, options, label, size }: Props<T>) {
  return (
    <div className="radio-group" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <Radio
          key={o.value}
          name={name}
          value={o.value}
          size={size}
          checked={value === o.value}
          disabled={o.disabled}
          onChange={() => onChange(o.value)}
          label={o.label}
        />
      ))}
    </div>
  )
}
