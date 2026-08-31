import './TagInput.css'
import { useState, type KeyboardEvent } from 'react'
import { cn } from '../../lib/cn'
import { Chip } from '../Chip'

type Props = {
  /** The committed tags, in order. */
  value: string[]
  onChange: (value: string[]) => void
  /** Accessible name for the text field. */
  label: string
  placeholder?: string
  /** A STATE, not a style: it turns the border and hands <Field> the hook it needs to read the
   *  error out as part of the field.
   */
  invalid?: boolean
  /** Dims the field and its tags together; existing tags stop offering their remove button. */
  disabled?: boolean
  className?: string
}

/* Free-text tags: type, press Enter or comma, get a removable <Chip> token. For
 * choosing from a KNOWN option list use <Combobox multiple>; this one is for
 * values the user invents (emails, labels, keywords). Duplicates are dropped
 * case-insensitively, blur commits what was typed, and Backspace in the empty
 * field removes the last tag. 
   *
   * Copy: the placeholder says how to add one — "Type and press Enter" — because a
   * field that accepts many values does not look like one that does.
   */
export function TagInput({ value, onChange, label, placeholder, invalid, disabled, className }: Props) {
  const [draft, setDraft] = useState('')

  const commit = () => {
    const tag = draft.trim()
    if (!tag) return
    if (!value.some((t) => t.toLowerCase() === tag.toLowerCase())) onChange([...value, tag])
    setDraft('')
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className={cn('taginput', className)} data-invalid={invalid || undefined} data-disabled={disabled || undefined}>
      {value.map((tag) => (
        <Chip
          key={tag}
          size="sm"
          onRemove={disabled ? undefined : () => onChange(value.filter((t) => t !== tag))}
          removeLabel={`Remove ${tag}`}
        >
          {tag}
        </Chip>
      ))}
      <input
        className="taginput-field"
        value={draft}
        placeholder={value.length === 0 ? placeholder : undefined}
        disabled={disabled}
        aria-label={label}
        aria-invalid={invalid || undefined}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={commit}
      />
    </div>
  )
}
