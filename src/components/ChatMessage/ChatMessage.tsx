import './ChatMessage.css'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Chip } from '../Chip'
import { IconButton } from '../IconButton'
import { Tooltip } from '../Tooltip'

/** Quick-reply chip offered under an assistant message. */
export type ChatChoice = { label: string; onClick?: () => void }

type Props = {
  /** Who is speaking, and the two turns are built differently: a user turn is a record with
   *  nothing to copy or rate, an assistant turn is an answer and carries the action row.
   */
  role: 'user' | 'assistant'
  /** Plain text of the message — used by copy + read-aloud on assistant rows. */
  text?: string
  /** Quick-reply chips under an assistant message. */
  choices?: readonly ChatChoice[]
  /** Hide the built-in action toolbar (copy / read / feedback). */
  hideActions?: boolean
  /** Fired when the user picks thumbs-down (e.g. to open a feedback dialog). */
  onDislike?: () => void
  children: ReactNode
}

/* One chat message: a right-aligned bubble for the user, a left block for the
 * assistant with a working toolbar (read aloud, copy, thumbs up/down) +
 * optional quick-reply chips. Shared by every chat surface. */
export function ChatMessage({ role, text, choices, hideActions, onDislike, children }: Props) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null)
  const copyResetRef = useRef<number | null>(null)

  /* Clear the pending copy-reset timer on unmount (no setState after teardown). */
  useEffect(() => () => {
    if (copyResetRef.current !== null) window.clearTimeout(copyResetRef.current)
  }, [])

  if (role === 'user') {
    return (
      <div className="chat-msg chat-msg-user">
        <div className="chat-bubble">{children}</div>
      </div>
    )
  }

  const copy = () => {
    if (text) navigator.clipboard?.writeText(text).catch(() => {})
    setCopied(true)
    if (copyResetRef.current !== null) window.clearTimeout(copyResetRef.current)
    copyResetRef.current = window.setTimeout(() => setCopied(false), 1500)
  }

  const togglePlay = () => {
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined
    if (!synth || !text) { setPlaying((p) => !p); return }
    if (playing) { synth.cancel(); setPlaying(false); return }
    synth.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.onend = () => setPlaying(false)
    synth.speak(u)
    setPlaying(true)
  }

  const vote = (r: 'up' | 'down') => {
    setFeedback((cur) => (cur === r ? null : r))
    if (r === 'down' && feedback !== 'down') onDislike?.()
  }

  const listenLabel = playing ? t('agent.action.stop', { defaultValue: 'Stop' }) : t('agent.action.listen')
  const copyLabel = copied ? t('agent.action.copied', { defaultValue: 'Copied' }) : t('agent.action.copy')

  return (
    <div className="chat-msg chat-msg-assistant">
      <div className="chat-msg-body">{children}</div>
      {choices && choices.length > 0 && (
        <div className="chat-choices">
          {choices.map((c) => (
            <Chip key={c.label} onClick={c.onClick}>{c.label}</Chip>
          ))}
        </div>
      )}
      {!hideActions && (
        <div className="chat-msg-actions">
          <Tooltip content={listenLabel}>
            <IconButton
              icon={playing ? 'stop' : 'volume'}
              size="md"
              aria-label={listenLabel}
              aria-pressed={playing}
              data-active={playing || undefined}
              onClick={togglePlay}
            />
          </Tooltip>
          <Tooltip content={copyLabel}>
            <IconButton
              icon={copied ? 'check' : 'content_copy'}
              size="md"
              aria-label={copyLabel}
              data-active={copied || undefined}
              onClick={copy}
            />
          </Tooltip>
          <Tooltip content={t('agent.action.like')}>
            <IconButton
              icon="thumb_up"
              size="md"
              aria-label={t('agent.action.like')}
              aria-pressed={feedback === 'up'}
              data-active={feedback === 'up' || undefined}
              onClick={() => vote('up')}
            />
          </Tooltip>
          <Tooltip content={t('agent.action.dislike')}>
            <IconButton
              icon="thumb_down"
              size="md"
              aria-label={t('agent.action.dislike')}
              aria-pressed={feedback === 'down'}
              data-active={feedback === 'down' || undefined}
              onClick={() => vote('down')}
            />
          </Tooltip>
        </div>
      )}
    </div>
  )
}
