import './Combobox.css'
import { useId, useRef, useState, type KeyboardEvent } from 'react'
import { cn } from '../../lib/cn'
import { type Option } from '../../lib/option'
import { Icon } from '../Icon'
import { Chip } from '../Chip'
import { useListNavigation } from '../../lib/useListNavigation'

/** A Combobox choice. Nothing beyond the shared <Option>: this control renders
 *  a label and filters on it, and any field it does not draw would be a lie. */
export type ComboboxOption<V extends string> = Option<V>

type Props<V extends string> = {
  options: readonly ComboboxOption<V>[]
  /** Accessible name for the text field. */
  label: string
  /** Multi-select: `value` is an array and picks render as removable tags.
   *  Single (default): `value` is one option value. */
  multiple?: boolean
  /** One value in single mode, an array in multi mode. */
  value?: V | readonly V[]
  /** Receives one value in single mode, the full array in multi mode. Pass the
   *  handler that matches your `multiple` setting. */
  onChange: ((next: V) => void) | ((next: V[]) => void)
  placeholder?: string
  className?: string
  /** Matched against the option label, case-insensitive, by default. Pass a
   *  custom matcher to search other fields or fuzzy-match. */
  filter?: (option: ComboboxOption<V>, query: string) => boolean
  /** Shown when the query matches nothing. Default "No matches". */
  emptyLabel?: string
  /** sm / md (default) / lg — matches the shared control height/padding scale. */
  size?: 'sm' | 'md' | 'lg'
  /** Which surface the field sits on. On `muted` (a page/PageHeader) the border
   *  is dropped since the white fill separates it; `base` (default, a white card
   *  or form) keeps the border. Invalid + focus stay visible on both. */
  surface?: 'base' | 'muted'
}

const defaultFilter = <V extends string>(o: ComboboxOption<V>, q: string) =>
  o.label.toLowerCase().includes(q.trim().toLowerCase())

/* The listbox renders inline below the field rather than portaled: a filter box
 * is short-lived and scoped to its container. */

/** Searchable select — the ARIA combobox pattern (input + listbox), for when a
 *  plain <Select> has too many options to scan. Type to filter, Arrow keys to
 *  move, Enter to pick, Escape to close. `multiple` turns it into a token input
 *  where picks render as removable <Chip>s and the list stays open. 
 *
 * Copy: the empty label says what was searched for and offers the way out — "No
 * supplier matches 'nortwind'. Check the spelling, or add a supplier." A
 * bare "No results" leaves the reader stuck on their own typo.
 */
export function Combobox<V extends string>(props: Props<V>) {
  const { options, label, placeholder, className, filter = defaultFilter, emptyLabel = 'No matches', surface = 'base', size } = props
  const multiple = props.multiple === true
  /* The prop types are collapsed to one shape so the registry can read them;
   * `multiple` is the runtime discriminant, so value/onChange are narrowed by
   * cast here (the public API still matches the handler you pass). */
  const singleValue = props.value as V | undefined
  const selectedValues = multiple ? ((props.value as readonly V[] | undefined) ?? []) : []
  const onChangeSingle = props.onChange as (next: V) => void
  const onChangeMulti = props.onChange as (next: V[]) => void

  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const listId = useId()
  const optionId = (i: number) => `${listId}-opt-${i}`
  const wrapRef = useRef<HTMLDivElement>(null)

  const isSelected = (v: V) => (multiple ? selectedValues.includes(v) : singleValue === v)
  const singleLabel = !multiple ? options.find((o) => o.value === singleValue)?.label ?? '' : ''
  /* Single: show the picked label while closed, the query while typing.
   * Multi: the input is always just the query (picks are shown as tags). */
  const shown = multiple ? query : open ? query : singleLabel
  const matches = open ? options.filter((o) => filter(o, query)) : options

  const pick = (opt: ComboboxOption<V>) => {
    if (multiple) {
      const next = selectedValues.includes(opt.value)
        ? selectedValues.filter((v) => v !== opt.value)
        : [...selectedValues, opt.value]
      onChangeMulti(next)
      setQuery('')
      /* stay open so several can be picked in a row */
    } else {
      onChangeSingle(opt.value)
      setQuery('')
      setOpen(false)
    }
  }

  const removeTag = (v: V) => {
    if (multiple) onChangeMulti(selectedValues.filter((x) => x !== v))
  }

  const { active, setActive, handleKey } = useListNavigation({
    count: matches.length,
    onEnter: (i) => { const m = matches[i]; if (m) pick(m) },
  })

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    /* ArrowDown on a CLOSED field opens it and moves nothing, which is the
       listbox pattern and is this component's own answer — so it comes before
       the shared keys rather than inside them. Everything after that (both
       arrows, Home, End, Enter) is `useListNavigation`'s, and Home and End are
       new here: this list had them nowhere, and a searchable set is the one
       most worth jumping the ends of. */
    if (e.key === 'ArrowDown' && !open) { e.preventDefault(); setOpen(true); return }
    if (open && handleKey(e)) return
    if (e.key === 'Escape') {
      setOpen(false)
      setQuery('')
    } else if (e.key === 'Backspace' && multiple && query === '' && selectedValues.length) {
      /* Backspace on an empty field removes the last token, like a tag input. */
      removeTag(selectedValues[selectedValues.length - 1])
    }
  }

  const tags = multiple
    ? selectedValues.map((v) => ({ value: v, label: options.find((o) => o.value === v)?.label ?? v }))
    : []

  return (
    <div
      ref={wrapRef}
      className={cn('combobox', className)}
      data-multiple={multiple || undefined}
      data-size={size}
      /* The multi-select's field frame is the WRAPPER, not the input, so the
         surface has to be readable from the root as well. */
      data-surface={surface}
      onBlur={(e) => {
        if (!wrapRef.current?.contains(e.relatedTarget as Node)) {
          setOpen(false)
          setQuery('')
        }
      }}
    >
      <div className="combobox-field">
        {tags.map((t) => (
          <Chip key={t.value} size="sm" onRemove={() => removeTag(t.value)} removeLabel={`Remove ${t.label}`}>
            {t.label}
          </Chip>
        ))}
        <input
          className="input combobox-input"
          data-surface={surface}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && matches[active] ? optionId(active) : undefined}
          aria-label={label}
          placeholder={multiple && tags.length ? undefined : placeholder}
          value={shown}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setActive(0) }}
          onFocus={() => setOpen(true)}
          /* Reopen on click too: after a single-select pick the input keeps
             focus, so onFocus won't fire again and only a click can reopen the
             list (without this you had to blur and refocus). */
          onClick={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        <Icon name="arrow_drop_down" className="combobox-caret" />
      </div>

      {open && (
        <ul className="combobox-list" role="listbox" id={listId} aria-label={label} aria-multiselectable={multiple || undefined}>
          {matches.length === 0 && <li className="combobox-empty" role="presentation">{emptyLabel}</li>}
          {matches.map((opt, i) => (
            <li
              key={opt.value}
              id={optionId(i)}
              role="option"
              aria-selected={isSelected(opt.value)}
              className="combobox-option"
              data-active={i === active || undefined}
              /* mousedown, not click: fires before the input's blur so the
                 selection lands instead of the list closing first. */
              onMouseDown={(e) => { e.preventDefault(); pick(opt) }}
              onMouseEnter={() => setActive(i)}
            >
              {opt.label}
              {multiple && isSelected(opt.value) && <Icon name="check" className="combobox-check" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
