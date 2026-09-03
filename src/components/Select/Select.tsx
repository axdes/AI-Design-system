import './Select.css'
import { cn } from '../../lib/cn'
import { type Option } from '../../lib/option'
import { Icon } from '../Icon'
import { Dropdown, DropdownItem } from '../Dropdown'

/** A Select choice: the shared <Option> plus the one thing this control also
 *  renders — a choice shown but not pickable (an out-of-stock plan). */
export type SelectOption<V extends string> = Option<V> & { disabled?: boolean }

/* Monolithic because its props are one control's contract — the value, the
 * options, the state (disabled, invalid) and the fit (size, surface) — plus
 * `id` and `tabIndex`, which exist because the label outside points AT this
 * control and a roving focus has to be able to skip it. */
type Props<V extends string> = {
  value: V | undefined
  onChange: (next: V) => void
  options: readonly SelectOption<V>[]
  placeholder?: string
  /** For a select inside a ROVING TABINDEX container — a grid cell, a toolbar —
   *  where exactly one of many controls is in the tab order at a time. Left
   *  alone the trigger is an ordinary tab stop, which is right everywhere else.
   */
  tabIndex?: number
  /** Accessible label — applied to the trigger button. */
  label: string
  /** Lands on the trigger, so `<Field htmlFor>` reaches it and an `ErrorSummary`
   *  row can put focus on it. Without one the field is unreachable by name: a
   *  failed submit listed "Choose who takes this request", the row linked to an
   *  id nothing carried, and clicking it did nothing at all (owner, 2026-08-23). */
  id?: string
  className?: string
  /** sm / md (default) / lg — matches the control scale. */
  size?: 'sm' | 'md' | 'lg'
  /** Not editable and not openable. */
  disabled?: boolean
  /**
   * Failed validation: paints the red border. It does NOT announce anything, and
   * the description here used to claim `aria-invalid`, which the component never
   * set — and could not: the trigger is a `<button>`, and `aria-invalid` is not
   * supported on that role. Nor is the widget a real ARIA combobox: its popup is
   * a `menu` of `menuitem`s, so calling the trigger a combobox would be a
   * different lie. Until a listbox-based select exists, the error TEXT is what
   * carries the meaning, and the caller has to associate it — `<Field>` has no
   * error slot yet, which is the actual gap.
   */
  invalid?: boolean
  /** Which surface the field sits on. On `muted` (a page/PageHeader) the border
   *  is dropped since the white fill separates it; `base` (default, a white card
   *  or form) keeps the border. Invalid + focus stay visible on both. */
  surface?: 'base' | 'muted'
}

/**
 * Single choice from a short list, built on Dropdown so the menu can match the
 * trigger width. Combobox is the one for a long list.
 *
 * Copy: the label names the value, the placeholder names the choice not yet made
 * — "Choose a region". Options are parallel and never restate the label.
 */
export function Select<V extends string>({
  value, onChange, options, placeholder, label, id, className, size, disabled, invalid, surface = 'base', tabIndex,
}: Props<V>) {
  const selected = options.find((o) => o.value === value)
  const display = selected?.label ?? placeholder ?? ''

  return (
    <Dropdown
      align="start"
      /* The menu is exactly as wide as the field. Both this component's own doc
         comment and the system contract said so; neither was true, because
         nothing passed the option through and the `select-menu` class it did
         pass was styled by nobody. A choice list narrower or wider than the
         field it belongs to reads as a different control. */
      matchTriggerWidth
      /* Through the Dropdown, not onto the button: the menu labels itself by the
         trigger's id, so the two have to be the same one. */
      triggerId={id}
      trigger={({ isOpen, ...triggerProps }) => (
        <button
          type="button"
          className={cn('select-trigger', className)}
          data-size={size}
          data-open={isOpen || undefined}
          data-placeholder={!selected || undefined}
          data-invalid={invalid || undefined}
          data-surface={surface}
          disabled={disabled || undefined}
          aria-label={label}
          {...triggerProps}
          tabIndex={tabIndex}
        >
          <span className="select-value">{display}</span>
          <Icon name="arrow_drop_down" />
        </button>
      )}
    >
      {options.map((opt) => (
        <DropdownItem
          key={opt.value}
          onClick={() => onChange(opt.value)}
          selected={opt.value === value}
          disabled={opt.disabled}
        >
          {opt.label}
        </DropdownItem>
      ))}
    </Dropdown>
  )
}
