import './AssistantPage.css'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../lib/AuthProvider'
import { useToast } from '../lib/ToastProvider'
import { Button } from '../components/Button'
import { Chip } from '../components/Chip'
import { Icon } from '../components/Icon'
import { Input } from '../components/Input'
import { Textarea } from '../components/Textarea'
import { SectionLabel } from '../components/SectionLabel'
import { ChatComposer } from '../components/ChatComposer'
import { ChatMessage } from '../components/ChatMessage'
import { Field } from '../components/Field'
import { Select } from '../components/Select'
import { AppShell } from '../shell/AppShell'
import { ChatHistory, type ChatHistoryItem } from '../shell/ChatHistory'
import { ChatShell } from '../components/ChatShell'
import { FeedbackModal } from '../components/FeedbackModal'
import { SidePanel } from '../components/SidePanel'

type Msg = { id: string; role: 'user' | 'assistant'; content: string }
type LeaveType = 'regular' | 'sick' | 'personal'

export function AssistantPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { toast } = useToast()
  const [collapsed, setCollapsed] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([])
  const [chats, setChats] = useState<ChatHistoryItem[]>([])
  const [streaming, setStreaming] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [leaveType, setLeaveType] = useState<LeaveType>('regular')
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const nextIdRef = useRef(0)
  const replyTimerRef = useRef<number | undefined>(undefined)

  const firstName = user?.fullName.split(' ')[0] ?? ''
  const hasChats = chats.length > 0

  const leaveOptions = (['regular', 'sick', 'personal'] as const).map((v) => ({
    value: v,
    label: t(`agent.leaveType.${v}`),
  }))

  /* First message of a fresh conversation → add it to the history column. */
  const ensureChat = (title: string) => {
    if (messages.length > 0) return
    const id = `chat-${nextIdRef.current}`
    setChats((prev) => [
      { id, icon: 'message', title: title.slice(0, 40), active: true },
      ...prev.map((c) => ({ ...c, active: false })),
    ])
  }

  const send = (text: string) => {
    ensureChat(text)
    const n = nextIdRef.current++
    setMessages((prev) => [...prev, { id: `u-${n}`, role: 'user', content: text }])
    setStreaming(true)
    replyTimerRef.current = window.setTimeout(() => {
      setMessages((prev) => [...prev, { id: `a-${n}`, role: 'assistant', content: t('assistant.reply') }])
      setStreaming(false)
    }, 1400)
  }

  const stop = () => {
    if (replyTimerRef.current) window.clearTimeout(replyTimerRef.current)
    setStreaming(false)
  }

  /* Quick action — open the HR leave form and seed the agent's intro. */
  const startLeaveRequest = () => {
    ensureChat(t('assistant.leavePrompt'))
    setFormOpen(true)
    const n = nextIdRef.current++
    setMessages((prev) => [
      ...prev,
      { id: `u-${n}`, role: 'user', content: t('assistant.leavePrompt') },
      { id: `a-${n}`, role: 'assistant', content: t('assistant.leaveReply') },
    ])
  }

  const newChat = () => {
    setMessages([])
    setFormOpen(false)
    setChats((prev) => prev.map((c) => ({ ...c, active: false })))
  }

  useEffect(() => () => { if (replyTimerRef.current) window.clearTimeout(replyTimerRef.current) }, [])

  const empty = messages.length === 0

  return (
    <AppShell>
      <ChatShell collapsed={collapsed} panel={formOpen} noSidebar={!hasChats}>
        {hasChats && (
          <ChatHistory
            groups={[{ items: chats }]}
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed((v) => !v)}
            onNew={newChat}
          />
        )}

        {/* A div, not a <main>. The shell already renders the page's one main
            landmark, and a second one inside it makes a screen reader offer two
            "main" regions with no way to tell which is the page. Caught by axe
            in a real browser, which only started running here on 2026-07-31. */}
        <div className="assistant-main" data-empty={empty || undefined}>
          {empty ? (
            <div className="assistant-welcome">
              <div className="assistant-greeting-block">
                <h1 className="assistant-greeting">
                  {t('assistant.hello')}, <span className="assistant-greeting-name">{firstName}</span>
                </h1>
                <p className="assistant-subtitle">{t('assistant.subtitle')}</p>
              </div>
              <ChatComposer className="assistant-composer" onSend={send} streaming={streaming} onStop={stop} />
              <Chip icon="calendar" onClick={startLeaveRequest}>{t('assistant.leavePrompt')}</Chip>
            </div>
          ) : (
            <>
              <div className="assistant-messages">
                {messages.map((m) => (
                  <ChatMessage
                    key={m.id}
                    role={m.role}
                    text={m.role === 'assistant' ? m.content : undefined}
                    onDislike={m.role === 'assistant' ? () => setFeedbackOpen(true) : undefined}
                  >
                    {m.content}
                  </ChatMessage>
                ))}
              </div>
              <ChatComposer className="assistant-composer assistant-composer--docked" onSend={send} streaming={streaming} onStop={stop} />
            </>
          )}
        </div>

        {formOpen && (
          <SidePanel
            className="assistant-form-panel"
            title={t('agent.panel.title')}
            onClose={() => setFormOpen(false)}
            footer={
              <>
                <Button>{t('agent.panel.submit')}</Button>
                <Button variant="secondary">{t('agent.panel.cancel')}</Button>
              </>
            }
          >
            <SectionLabel>{t('agent.panel.section')}</SectionLabel>
            <Field label={t('agent.panel.leaveType')}>
              <Select
                className="assistant-form-control"
                label={t('agent.panel.leaveType')}
                value={leaveType}
                onChange={setLeaveType}
                options={leaveOptions}
              />
            </Field>
            <Field label={t('agent.panel.dateLabel')} required htmlFor="leave-dates">
              <div className="assistant-date-field">
                <Input id="leave-dates" placeholder="DD.MM.YYYY - DD.MM.YYYY" />
                <Icon name="calendar" className="assistant-date-icon" />
              </div>
            </Field>
            <Field label={t('agent.panel.remarks')} htmlFor="leave-remarks">
              <Textarea id="leave-remarks" placeholder={t('agent.panel.remarksPlaceholder')} />
            </Field>
          </SidePanel>
        )}
      </ChatShell>

      <FeedbackModal
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        onSubmit={() => { setFeedbackOpen(false); toast({ tone: 'success', title: t('agent.feedback.sent') }) }}
        labels={{
          title: t('agent.feedback.title'),
          close: t('agent.feedback.close'),
          send: t('agent.feedback.send'),
          desc: t('agent.feedback.desc'),
          detailsLabel: t('agent.feedback.detailsLabel'),
          detailsPlaceholder: t('agent.feedback.detailsPlaceholder'),
          reasons: {
            wrong: t('agent.feedback.reasons.wrong'),
            incomplete: t('agent.feedback.reasons.incomplete'),
            unclear: t('agent.feedback.reasons.unclear'),
            other: t('agent.feedback.reasons.other'),
          },
        }}
      />
    </AppShell>
  )
}
