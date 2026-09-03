import './FilterDropdown.css'
import { useState, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { type Option } from '../../lib/option'
import { Icon, type IconName } from '../Icon'
import { Dropdown, DropdownItem } from '../Dropdown'
import { SearchInput } from '../SearchInput'
import { Chip } from '../Chip'
import { useFilterBar } from '../../lib/filterBarContext'

/** A filter choice: the shared <Option> plus what a filter menu also draws —
 *  a leading mark, and a trailing count that rolls the per-status statistics
 *  into the filter so a separate counter row is not needed.
 *
 *  It was declared here already, NOT generic, and `Props` then repeated its
 *  shape as an inline literal below — a type nobody used sitting above a copy
 *  of itself (2026-08-26). Now it is generic and Props uses it. */
export type FilterOption<V extends string> = Option<V> & {
  icon?: IconName
  count?: number
}

/* Monolithic because a filter is four things that have to agree: the
 * trigger, the menu, the "all" row that means no filter, and the tags under
 * it that remove one. Fifteen props is the most in this catalogue and it is
 * the one to watch — reopened the moment a fifth prop is proposed for the
 * trigger, because that is the group that would become an object. */
type Props<V extends string> = {
  label: string
  options: readonly FilterOption<V>[]
  value: readonly V[]
  onChange: (next: V[]) => void
  /** Default true — several choices at once, and each toggle keeps the menu
   *  open. The word is `multiple`, matching <Combobox> and <SelectableTile>:
   *  this control called it `multiple` and nothing caught it, because lint:vocab
   *  reads union props and a boolean has no union (2026-08-26). */
  multiple?: boolean
  /** Label of the permanent "all" row (e.g. "All types"). Empty value = all. */
  allLabel: string
  /** Optional trailing count on the "all" row (total across options). */
  allCount?: number
  /** Optional leading icon on the "all" row (pair it with option icons). */
  allIcon?: IconName
  /** Render the trigger as "Label: selected values" instead of the static
   * label + count chip; values fall back to `allLabel` when nothing is selected. */
  showValue?: boolean
  /** Overrides the trigger value text (showValue mode) when something is
   *  selected, e.g. "2 operators" or a picked date range. */
  valueText?: string
  /** Extra rows/controls rendered after the "all" row (e.g. an option that
   *  reveals a date range). Rendered as-is: rows that must keep the menu
   *  open and free-form inputs bring their own propagation guards. */
  menuExtra?: ReactNode
  /** A search row pinned at the top of the menu that narrows the option rows
   *  as you type — for a vocabulary too long to scan (a 21-value role list is
   *  why it exists). The "all" row stays put, and closing the menu clears the
   *  query. */
  searchable?: boolean
  /** The current selection as removable tags directly under THIS trigger —
   *  read what is picked and undo a piece of it without reopening the menu.
   *  Under its own row, not pooled at the bottom of the panel: a tag beside
   *  the control that made it needs no second label saying where it came from. */
  showTags?: boolean
  /** Placeholder (and accessible name) of the search row. Default "Search". */
  searchPlaceholder?: string
  className?: string
}

/* The menu body owns the search query so that closing the menu clears it for
 * free: Dropdown unmounts its children when it closes, and remounting starts
 * from the full list. Keeping the query in FilterDropdown itself would leave a
 * stale filter behind a closed menu. */
function SearchableOptions<V extends string>({
  placeholder,
  options,
  children,
}: {
  placeholder: string
  options: readonly FilterOption<V>[]
  children: (shown: readonly { value: V; label: string; icon?: IconName; count?: number }[]) => ReactNode
}) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const shown = q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options

  /* The menu owns Arrow navigation and letter typeahead; both would fight a
   * text field, so printable keys stay here. Escape and the Arrows pass
   * through — closing and walking the rows must keep working from the field. */
  const guardKeys = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Escape' || e.key === 'ArrowDown' || e.key === 'ArrowUp') return
    e.stopPropagation()
  }

  return (
    <>
      {/* stopPropagation on click: a press inside the field is not a pick and
        * must not dismiss the menu. */}
      <div
        className="filter-menu-search"
        role="presentation"
        onKeyDown={guardKeys}
        onClick={(e) => e.stopPropagation()}
      >
        <SearchInput
          expanded
          placeholder={placeholder}
          aria-label={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onClear={() => setQuery('')}
        />
      </div>
      {children(shown)}
      {shown.length === 0 && (
        <div className="filter-menu-empty" role="presentation">
          {/* Deliberately not a menu item: there is nothing to pick. */}
          No matches
        </div>
      )}
    </>
  )
}

/**
 * One filter as a chip: the current selection reads on the trigger and the
 * options are typed by their value.
 *
 * Copy: the label is the field being filtered; `allLabel` is the unfiltered
 * state in the reader's words — "Any region", not "All".
 */
export function FilterDropdown<V extends string>({
  label, options, value, onChange, multiple = true, allLabel, allCount, allIcon, showValue, valueText, menuExtra, searchable, searchPlaceholder = 'Search', showTags, className,
}: Props<V>) {
  const { inSheet } = useFilterBar()
  const isSelected = (v: V) => value.includes(v)
  const noneSelected = value.length === 0
  const selectedLabels = options
    .filter((o) => isSelected(o.value))
    .map((o) => o.label)
    .join(', ')

  /* Statistics on the trigger itself (visible without opening): only the count
   * of a SPECIFIC selection. The "all" total is skipped on the trigger - it
   * equals the current result-set size, so it would read the same on every
   * filter. The per-option breakdown (the real analytics) lives in the menu. */
  const hasCounts = allCount !== undefined || options.some((o) => o.count !== undefined)
  const triggerCount = noneSelected
    ? undefined
    : options.filter((o) => isSelected(o.value)).reduce((n, o) => n + (o.count ?? 0), 0)

  /* Hand-picking every option means "all": normalise to the empty (= all)
   * state so the checks collapse onto the All row and the trigger reads
   * "Label: All ..." instead of listing the full set. */
  const toggle = (v: V) => {
    if (!multiple) {
      onChange(isSelected(v) ? [] : [v])
      return
    }
    const next = isSelected(v) ? value.filter((x) => x !== v) : [...value, v]
    onChange(next.length === options.length ? [] : next)
  }

  const renderOption = (opt: { value: V; label: string; icon?: IconName; count?: number }) => (
    <DropdownItem
      key={opt.value}
      icon={opt.icon}
      onClick={() => toggle(opt.value)}
      selected={isSelected(opt.value)}
    >
      {opt.label}
      {opt.count !== undefined && (
        <span className="filter-option-count">
          {opt.count}
          {isSelected(opt.value) && <Icon name="check" className="filter-option-check" />}
        </span>
      )}
    </DropdownItem>
  )

  const selected = options.filter((o) => isSelected(o.value))

  return (
    <div className="filter-dropdown-stack">
    <Dropdown
      align="start"
      closeOnSelect={!multiple}
      /* Sheet mode locks the menu to the trigger; otherwise the menu opens at
       * least as wide as the pill and grows with longer rows. */
      matchTriggerWidth={inSheet || 'min'}
      className={cn('filter-dropdown', className)}
      menuClassName="filter-menu"
      trigger={({ isOpen, ...triggerProps }) => (
        <button
          type="button"
          className="filter-trigger"
          data-active={value.length > 0 || undefined}
          data-open={isOpen || undefined}
          {...triggerProps}
        >
          {showValue ? (
            <>
              <span>{label}:</span>
              <span className="filter-value">
                {noneSelected ? allLabel : valueText ?? selectedLabels}
              </span>
            </>
          ) : (
            <>
              <span>{label}</span>
              {value.length > 0 && (
                <span className="filter-count" aria-hidden="true">
                  {value.length}
                </span>
              )}
            </>
          )}
          {hasCounts && triggerCount !== undefined && (
            <span className="filter-trigger-count" aria-hidden="true">
              {triggerCount}
            </span>
          )}
          <Icon name="arrow_drop_down" />
        </button>
      )}
    >
      {searchable ? (
        <SearchableOptions placeholder={searchPlaceholder} options={options}>
          {(shown) => shown.map(renderOption)}
        </SearchableOptions>
      ) : (
        options.map(renderOption)
      )}
      {/* Permanent "All ..." row: a regular option, selected when nothing is
       * picked (= all). No destructive "Clear all" - clearing IS choosing
       * all (by review: a red Clear all read as a different action). */}
      <DropdownItem
        className="filter-reset"
        icon={allIcon}
        onClick={() => onChange([])}
        selected={noneSelected}
      >
        {allLabel}
        {allCount !== undefined && (
          <span className="filter-option-count">
            {allCount}
            {noneSelected && <Icon name="check" className="filter-option-check" />}
          </span>
        )}
      </DropdownItem>
      {menuExtra}
    </Dropdown>
    {/* Each picked value as a removable tag under ITS OWN trigger, not pooled
      * at the bottom of a panel: a tag beside the control that made it needs
      * no second label saying where it came from. Removing one is the same
      * state change as unticking it in the menu. */}
    {showTags && selected.length > 0 && (
      <div className="filter-tags">
        {selected.map((o) => (
          <Chip key={o.value} onRemove={() => toggle(o.value)} removeLabel={`Remove ${o.label}`}>
            {o.label}
          </Chip>
        ))}
      </div>
    )}
    </div>
  )
}
