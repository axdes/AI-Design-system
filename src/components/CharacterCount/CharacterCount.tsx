import './CharacterCount.css'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/cn'

type Props = {
  /** The control's current value. The count is derived, never stored twice. */
  value: string
  /** The budget. Past it the count turns into an error rather than a warning. */
  max: number
  className?: string
}

/* A limit the user only learns about when the form rejects them is a trap, and
 * a limit announced on every keystroke is a screen reader that never stops
 * talking. So there are two copies of the same fact: the visible one updates
 * instantly and is hidden from assistive tech, and the announced one waits for
 * a pause in typing (GOV.UK character count). */

const ANNOUNCE_AFTER = 1000

/** The remaining budget of a limited field, stated under it: instant on screen,
 *  announced only once typing stops. */
export function CharacterCount({ value, max, className }: Props) {
  const { t } = useTranslation()
  const remaining = max - value.length
  const over = remaining < 0
  const label = over
    ? t('field.charsOver', { count: -remaining })
    : t('field.charsLeft', { count: remaining })

  const [announced, setAnnounced] = useState(label)
  useEffect(() => {
    const id = window.setTimeout(() => setAnnounced(label), ANNOUNCE_AFTER)
    return () => { window.clearTimeout(id) }
  }, [label])

  return (
    <>
      <span className={cn('character-count', className)} data-error={over ? '' : undefined} aria-hidden="true">
        {label}
      </span>
      {/* The same sentence, late and polite: it never interrupts the letter the
        * user is in the middle of typing. */}
      <span className="character-count-live" role="status">{announced}</span>
    </>
  )
}
