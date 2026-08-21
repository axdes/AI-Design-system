import { createContext, useCallback, use, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Icon, type IconName } from '../components/Icon'
import './toast.css'

type Tone = 'info' | 'success' | 'warning' | 'danger'

type Toast = {
  id: number
  tone: Tone
  title: string
  description?: string
  /** One control under the message, for the thing the toast is about: Undo,
   *  Retry, View. Keep it to one — a toast is a notice, not a dialog, and it
   *  disappears on a timer. */
  action?: ReactNode
}

type ToastContextValue = {
  toast: (t: Omit<Toast, 'id'> & { duration?: number }) => void
  dismiss: (id: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const TONE_ICON: Record<Tone, IconName> = {
  info: 'info',
  success: 'check_circle',
  warning: 'warning',
  danger: 'error',
}

/* Cap concurrently visible toasts; extras wait in a queue and surface as
 * earlier ones dismiss. Keeps the corner calm under a burst of events. */
const MAX_VISIBLE = 3

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const queueRef = useRef<Toast[]>([])
  const nextIdRef = useRef(1)
  const timersRef = useRef<Map<number, number>>(new Map())
  const durationsRef = useRef<Map<number, number>>(new Map())
  const { t } = useTranslation()

  /* `arm` and `dismiss` call each other: arming a toast schedules its dismissal,
   * and dismissing one arms the next from the queue. A ref breaks the cycle, and
   * it has to be DECLARED before both of them, not just assigned after, or the
   * earlier one reads a binding that does not exist yet in source order. The
   * assignment lives in an effect below for the same reason `useLatest` exists:
   * render must not write to a ref. */
  const dismissRef = useRef<(id: number) => void>(() => undefined)

  const arm = useCallback((id: number, duration: number) => {
    const handle = window.setTimeout(() => dismissRef.current(id), duration)
    timersRef.current.set(id, handle)
  }, [])

  const dismiss = useCallback((id: number) => {
    const handle = timersRef.current.get(id)
    if (handle) { window.clearTimeout(handle); timersRef.current.delete(id) }
    durationsRef.current.delete(id)
    setToasts((prev) => {
      const next = prev.filter((x) => x.id !== id)
      const promoted = queueRef.current.shift()
      if (promoted) {
        next.push(promoted)
        arm(promoted.id, durationsRef.current.get(promoted.id) ?? 4000)
      }
      return next
    })
  }, [arm])

  // The timeout callback always sees the latest dismiss (see the ref above).
  useEffect(() => { dismissRef.current = dismiss })

  const toast = useCallback<ToastContextValue['toast']>(({ duration, ...rest }) => {
    const id = nextIdRef.current++
    const item: Toast = { id, ...rest }
    /* An Undo that vanishes in four seconds is a trap, so a toast the user is
     * meant to act on gets twice as long to be acted on. */
    const ms = duration ?? (rest.action ? 8000 : 4000)
    durationsRef.current.set(id, ms)
    setToasts((prev) => {
      if (prev.length >= MAX_VISIBLE) {
        queueRef.current.push(item)
        return prev
      }
      arm(id, ms)
      return [...prev, item]
    })
  }, [arm])

  useEffect(() => () => {
    timersRef.current.forEach((h) => window.clearTimeout(h))
    timersRef.current.clear()
  }, [])

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss])

  return (
    <ToastContext value={value}>
      {children}
      {createPortal(
        <div className="toast-region" role="region" aria-label={t('a11y.notifications')}>
          {toasts.map((item) => (
            /* Danger interrupts, everything else waits its turn: `status` is a
             * polite live region, so a failure announced that way can sit behind
             * whatever the screen reader is already saying. */
            <div key={item.id} className="toast" data-tone={item.tone} role={item.tone === 'danger' ? 'alert' : 'status'}>
              <span className="toast-icon">
                <Icon name={TONE_ICON[item.tone]} />
              </span>
              <div className="toast-body">
                <div className="toast-title">{item.title}</div>
                {item.description && <div className="toast-desc">{item.description}</div>}
                {item.action && <div className="toast-action">{item.action}</div>}
              </div>
              <button
                type="button"
                className="toast-close"
                aria-label={t('a11y.dismiss')}
                onClick={() => dismiss(item.id)}
              >
                <Icon name="close" />
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext>
  )
}

export function useToast() {
  const ctx = use(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
