import './ChatComposer.css'
import { useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/cn'
import { Icon } from '../Icon'
import { IconButton } from '../IconButton'
import { Tooltip } from '../Tooltip'

type Props = {
  /** Controlled value (optional — composer manages its own state otherwise). */
  value?: string
  onChange?: (next: string) => void
  /** Called with the trimmed text on submit. */
  onSend?: (text: string) => void
  /** Assistant is responding — swaps send for a stop button. */
  streaming?: boolean
  /** Called when the stop button is pressed. */
  onStop?: () => void
  placeholder?: string
  /** Decorative AI spark at the inline start — marks the bar as AI-powered. */
  aiSpark?: boolean
  className?: string
}

/* Tapping the mic starts a MOCK recording: a pulsing waveform replaces the
 * field and the mic turns danger. There is no audio pipeline behind it. */

/** Rounded chat input bar: auto-growing textarea plus voice/send. A pill on one
 *  line, rounded-rect once it grows; the mic swaps to a brand-filled send as
 *  soon as there is text. Enter sends, Shift+Enter adds a newline. The consumer
 *  positions it. 
 *
 * Copy: the placeholder is an invitation, not an instruction manual: one short
 * line naming what this assistant can be asked. It disappears the moment
 * anyone types, so nothing a reader needs may live only there.
 */
export function ChatComposer({ value, onChange, onSend, streaming, onStop, placeholder, aiSpark, className }: Props) {
  const { t } = useTranslation()
  const [inner, setInner] = useState('')
  const val = value ?? inner
  const set = (v: string) => (onChange ? onChange(v) : setInner(v))
  const fieldRef = useRef<HTMLTextAreaElement>(null)
  const [stretched, setStretched] = useState(false)
  const [recording, setRecording] = useState(false)

  /* Auto-grow: reset to measure, grow to content (CSS caps via max-height). */
  useLayoutEffect(() => {
    const ta = fieldRef.current
    if (!ta) return
    ta.style.height = 'auto'
    const oneLine = parseFloat(getComputedStyle(ta).minHeight) || 0
    setStretched(ta.scrollHeight > oneLine + 4)
    ta.style.height = `${ta.scrollHeight}px`
  }, [val])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const text = val.trim()
    if (!text) return
    onSend?.(text)
    if (value === undefined) setInner('')
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit(e)
    }
  }

  const sendVoice = () => {
    setRecording(false)
    onSend?.(t('agent.voiceMessage', { defaultValue: 'Voice message' }))
  }

  const ph = placeholder ?? t('agent.inputPlaceholder')
  const hasText = val.trim().length > 0
  return (
    <form
      className={cn('chat-composer', className)}
      data-stretched={(stretched && !recording) || undefined}
      data-recording={recording || undefined}
      onSubmit={submit}
    >
      {aiSpark && (
        <span className="chat-composer-spark" aria-hidden="true">
          <Icon name="sparkles" size="md" />
        </span>
      )}

      {recording ? (
        <span className="chat-composer-waveform" aria-label={t('agent.listening', { defaultValue: 'Listening' })}>
          {Array.from({ length: 10 }).map((_, i) => (
            // eslint-disable-next-line @eslint-react/no-array-index-key -- static, append-only list; index is a stable key here
            <span key={i} />
          ))}
        </span>
      ) : (
        <textarea
          ref={fieldRef}
          className="chat-composer-field"
          rows={1}
          value={val}
          onChange={(e) => set(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={ph}
          aria-label={ph}
        />
      )}

      {/* eslint-disable sonarjs/no-nested-conditional -- JSX state-render (streaming|recording|has-text|idle); an early-return helper would scatter the markup */}
      {streaming ? (
        <Tooltip content={t('agent.stop', { defaultValue: 'Stop' })}>
          <IconButton
            icon="stop"
            size="md"
            variant="filled"
            tone="destructive"
            type="button"
            aria-label={t('agent.stop', { defaultValue: 'Stop' })}
            onClick={onStop}
          />
        </Tooltip>
      ) : recording ? (
        <>
          {/* Cancel the recording (discard). */}
          <Tooltip content={t('agent.cancel', { defaultValue: 'Cancel' })}>
            <IconButton
              icon="close"
              size="md"
              type="button"
              className="chat-composer-voice is-recording"
              aria-label={t('agent.cancel', { defaultValue: 'Cancel' })}
              onClick={() => setRecording(false)}
            />
          </Tooltip>
          {/* Finish + send the voice message. */}
          <Tooltip content={t('agent.send')}>
            <IconButton
              icon="send"
              size="md"
              variant="filled"
              tone="primary"
              type="button"
              aria-label={t('agent.send')}
              onClick={sendVoice}
            />
          </Tooltip>
        </>
      ) : hasText ? (
        <Tooltip content={t('agent.send')}>
          <IconButton icon="send" size="md" variant="filled" tone="primary" type="submit" aria-label={t('agent.send')} />
        </Tooltip>
      ) : (
        <Tooltip content={t('agent.voiceInput')}>
          <IconButton
            icon="mic"
            size="md"
            type="button"
            className="chat-composer-voice"
            aria-label={t('agent.voiceInput')}
            onClick={() => setRecording(true)}
          />
        </Tooltip>
      )}
      {/* eslint-enable sonarjs/no-nested-conditional */}
    </form>
  )
}
