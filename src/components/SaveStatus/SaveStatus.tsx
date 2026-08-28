import './SaveStatus.css'
import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/cn'
import { Icon } from '../Icon'
import { Time } from '../Time'

type State = 'idle' | 'saving' | 'saved' | 'error'

type Props = {
  state: State
  /** When the last successful save happened. Read with `state="saved"`. */
  at?: string | number | Date
  className?: string
}

/* A form that saves by itself has to say so, or the user invents their own
 * proof: they retype a sentence, or they leave and hope. This is that sentence,
 * and it is a live region because the event it reports is one nobody triggered
 * on purpose and nobody is looking at the corner for. `polite`, so it waits for
 * a gap in typing rather than interrupting it. */

/** Whether the work is safe right now: saving, saved at a time, or failed.
 *  The status line a draft form owes the user, beside its actions. 
 *
 * Copy: says whether the work is safe right now, in the fewest words that carry
 * it — "Saved 2 minutes ago", "Could not save". Never "All changes saved"
 * when they are not.
 */
export function SaveStatus({ state, at, className }: Props) {
  const { t } = useTranslation()
  return (
    <span className={cn('save-status', className)} data-state={state} role="status">
      {/* No spinner: <Spinner> is a live region of its own, and two nested
        * ones announce the same event twice. The word is the whole report. */}
      {state === 'saving' && t('field.saving')}
      {state === 'saved' && (
        <>
          <Icon name="check" />
          {t('field.saved')}
          {at !== undefined && <Time value={at} mode="relative" />}
        </>
      )}
      {state === 'error' && (
        <>
          <Icon name="warning" />
          {t('field.saveFailed')}
        </>
      )}
    </span>
  )
}
