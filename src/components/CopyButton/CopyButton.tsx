import './CopyButton.css'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/cn'
import { Button } from '../Button'
import { Icon } from '../Icon'
import { IconButton } from '../IconButton'
import { Tooltip } from '../Tooltip'

type Props = {
  /** What lands on the clipboard. */
  value: string
  /** Visible label. Without one the control is icon-only, in a Tooltip. */
  label?: string
  /** What the label becomes for two seconds after a successful copy.
   *  Defaults to the translated "Copied". */
  copiedLabel?: string
  size?: 'sm' | 'md'
  variant?: 'ghost' | 'secondary'
  className?: string
}

const HELD = 2000

/** Copy a value, and say so. The clipboard call, the two-second confirmation and
 *  the failure case in one place, because five apps had written all three. 
 *
 * Copy: the label says what will be copied, not that copying happens — "Copy the
 * invoice number". The confirmation is past tense and short.
 */
export function CopyButton({ value, label, copiedLabel, size = 'sm', variant = 'ghost', className }: Props) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const timerRef = useRef(0)

  useEffect(() => () => { window.clearTimeout(timerRef.current) }, [])

  const copy = () => {
    /* No optimistic tick. An insecure origin has no `navigator.clipboard` at
     * all, and a rejected write means the value is NOT on the clipboard, so
     * saying "Copied" there is a lie the user only finds out about on paste. */
    const written = navigator.clipboard?.writeText(value)
    if (!written) return
    void written.then(
      () => {
        setCopied(true)
        window.clearTimeout(timerRef.current)
        timerRef.current = window.setTimeout(() => setCopied(false), HELD)
      },
      () => undefined,
    )
  }

  const done = copiedLabel ?? t('a11y.copied')
  const idle = label ?? t('a11y.copy')
  const icon = copied ? 'check' : 'content_copy'

  return (
    <span className={cn('copy-button', className)} data-copied={copied || undefined}>
      {label ? (
        <Button variant={variant} size={size} onClick={copy}>
          <Icon name={icon} />
          {copied ? done : label}
        </Button>
      ) : (
        <Tooltip content={copied ? done : idle}>
          <IconButton icon={icon} size={size} aria-label={copied ? done : idle} onClick={copy} />
        </Tooltip>
      )}
      {/* The label change is enough for the eye. A live region is what tells a
          screen-reader user the copy actually happened, since nothing moves
          focus and nothing else on the page changes. */}
      <span className="sr-only" role="status">{copied ? done : ''}</span>
    </span>
  )
}
