import './SearchInput.css'
import { useRef, useState, type FocusEvent, type InputHTMLAttributes } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/cn'
import { Icon } from '../Icon'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  /** Which surface the field sits on. On `muted` (a page/PageHeader) the border
   *  is dropped since the white fill separates it; `base` (default, a white card
   *  or form) keeps the border. Invalid + focus stay visible on both. */
  surface?: 'base' | 'muted'
  /** Called when the user clicks the clear (×) button. Parent owns the value. */
  onClear?: () => void
  /** Always-open, persistent field (no collapse-to-icon). For panels/forms where
   * the search is a permanent control; width comes from `className`. */
  expanded?: boolean
}

/**
 * The search field: the icon, the clear button and the debounce contract in
 * one control.
 */
export function SearchInput({ className, value, onBlur, onClear, expanded, surface = 'base', ...rest }: Props) {
  const { t } = useTranslation()
  const hasValue = Boolean(value && String(value).length > 0)
  const [open, setOpen] = useState(hasValue)
  const inputRef = useRef<HTMLInputElement>(null)
  const isOpen = expanded || open || hasValue
  /* Expanded: the × only clears text (there is nothing to collapse to), so it
   * shows only with a value. Collapsible: × doubles as close, shown while open. */
  const showClear = expanded ? hasValue : isOpen

  const expand = () => {
    setOpen(true)
    /* Focus after the input becomes visible. flushSync + ref would be cleaner
     * but rAF is enough for this single-paint transition. */
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    if (!expanded && !e.currentTarget.value) setOpen(false)
    onBlur?.(e)
  }

  /* X button = clear text; on the collapsible variant it also collapses back. */
  const handleClose = () => {
    onClear?.()
    if (!expanded) setOpen(false)
  }

  return (
    <div className={cn('search-input', className)} data-open={isOpen || undefined} data-surface={surface}>
      <button
        type="button"
        className="search-input-toggle"
        aria-label={t('a11y.search')}
        tabIndex={isOpen ? -1 : 0}
        onClick={isOpen ? undefined : expand}
      >
        <Icon name="search" />
      </button>
      <input
        ref={inputRef}
        type="search"
        className="search-input-field"
        value={value}
        onBlur={handleBlur}
        tabIndex={isOpen ? 0 : -1}
        {...rest}
      />
      {showClear && (
        <button
          type="button"
          className="search-input-clear"
          aria-label={t('a11y.clear')}
          /* mousedown (not click) so it fires before the input's blur collapses it. */
          onMouseDown={(e) => { e.preventDefault(); handleClose() }}
        >
          <Icon name="close" />
        </button>
      )}
    </div>
  )
}
