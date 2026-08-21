import './CodeInput.css'
import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react'
import { cn } from '../../lib/cn'
import { Input } from '../Input'

type Props = {
  /** How many characters the code has. */
  length?: number
  /** The code so far. Shorter than `length` while it is being typed. */
  value: string
  onChange: (value: string) => void
  /** Names the group, since the individual boxes are "digit 1 of 6". */
  label: string
  invalid?: boolean
  /** Keep it to digits (default). Off for alphanumeric codes. */
  numeric?: boolean
  className?: string
}

/** One box per character, for a verification code.
 *
 *  A single field would work and would be less code. The boxes exist because a
 *  code arrives as separated characters in an SMS or an authenticator, and
 *  because checking six characters you have typed into one field means counting
 *  them. Paste still fills the whole thing in one go, which is how most people
 *  actually enter it. */
export function CodeInput({ length = 6, value, onChange, label, invalid, numeric = true, className }: Props) {
  const boxesRef = useRef<(HTMLInputElement | null)[]>([])

  const focus = (i: number) => { boxesRef.current[Math.max(0, Math.min(length - 1, i))]?.focus() }

  const put = (i: number, char: string) => {
    const next = value.padEnd(length, ' ').split('')
    next[i] = char
    onChange(next.join('').trimEnd())
  }

  const handleChange = (i: number, raw: string) => {
    /* A box holds one character, but a phone's autofill drops the whole code
     * into the first one, so treat anything longer as a paste. */
    const chars = [...raw].filter((ch) => (numeric ? /\d/.test(ch) : /\S/.test(ch)))
    if (chars.length === 0) { put(i, ' '); return }
    if (chars.length === 1) {
      put(i, chars[0])
      focus(i + 1)
      return
    }
    fill(i, chars)
  }

  const fill = (from: number, chars: string[]) => {
    const next = value.padEnd(length, ' ').split('')
    chars.slice(0, length - from).forEach((ch, n) => { next[from + n] = ch })
    onChange(next.join('').trimEnd())
    focus(from + chars.length)
  }

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[i]?.trim()) {
      /* Empty box: backspace walks back and clears the one before, which is what
       * a row of boxes has to do or the caret gets stuck on the first empty one. */
      e.preventDefault()
      put(i - 1, ' ')
      focus(i - 1)
    }
    if (e.key === 'ArrowLeft') { e.preventDefault(); focus(i - 1) }
    if (e.key === 'ArrowRight') { e.preventDefault(); focus(i + 1) }
  }

  const handlePaste = (i: number, e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const chars = [...e.clipboardData.getData('text')].filter((ch) => (numeric ? /\d/.test(ch) : /\S/.test(ch)))
    if (chars.length) fill(i, chars)
  }

  return (
    <div className={cn('code-input', className)} role="group" aria-label={label}>
      {Array.from({ length }, (_, i) => (
        <Input
          key={i}
          ref={(el) => { boxesRef.current[i] = el }}
          className="code-input-box"
          value={value[i]?.trim() ?? ''}
          invalid={invalid}
          inputMode={numeric ? 'numeric' : 'text'}
          /* The browser offers the SMS code on the first box; repeating the hint
           * on all six makes it offer the same code six times. */
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          aria-label={`${label}, ${String(i + 1)}/${String(length)}`}
          maxLength={1}
          onChange={(e) => { handleChange(i, e.target.value) }}
          onKeyDown={(e) => { handleKeyDown(i, e) }}
          onPaste={(e) => { handlePaste(i, e) }}
        />
      ))}
    </div>
  )
}
