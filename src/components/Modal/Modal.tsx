import './Modal.css'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/cn'
import { useLatest } from '../../lib/useLatest'
import { Button } from '../Button'
import { IconButton } from '../IconButton'
import { Tooltip } from '../Tooltip'

type Size = 'sm' | 'md' | 'lg'
type Placement = 'center' | 'drawer'

/**
 * THE DECISION ROW. A dialog that asks for something ends in cancel and
 * confirm, and this is where their order, their variants and their two
 * different kinds of "not yet" are decided once.
 *
 * It exists because <FormModal> and <ConfirmDialog> were two blocks that each
 * hand-built this row (2026-08-26). They carried no behaviour — the portal, the
 * focus trap, ESC and the scroll lock were always Modal's — so they were the
 * same four slots in the same order, twice, differing only in the values they
 * passed. A modal is a surface with content in it, and a decision is one of the
 * things content can be.
 */
type Actions = {
  /** The commitment. */
  onConfirm: () => void
  confirmLabel?: ReactNode
  cancelLabel?: ReactNode
  /** `destructive` for anything that deletes or cannot be undone, so a delete
   *  never looks like a save. */
  tone?: 'primary' | 'destructive'
  /**
   * The action is IN FLIGHT: the confirm shows a spinner. Not the same as
   * `confirmDisabled`, and the two used to share one `busy` prop across the two
   * blocks — one disabled the button and the other spun it, for the same word.
   */
  busy?: boolean
  /** Nothing to confirm YET: the form is empty or invalid. Greys the button. */
  confirmDisabled?: boolean
}

type Props = {
  /** The caller owns it. A modal renders nothing when closed, so mounting it conditionally as
   *  well is a second switch for one state.
   */
  open: boolean
  onClose: () => void
  title?: string
  /** How much room the CONTENT needs, and md is the floor: sm is reserved for a yes-or-no
   *  confirmation and nothing else, because a form in a small dialog scrolls before it has asked
   *  anything.
   */
  size?: Size
  /** center = floating dialog (default). drawer = panel docked to the inline-end
   * edge, full height, sliding in from the side. */
  placement?: Placement
  /** Click outside / Escape close. Default true. */
  dismissible?: boolean
  className?: string
  children: ReactNode
  /**
   * The decision this dialog asks for. Cancel is a ghost on the leading side,
   * confirm on the trailing one — one order, decided here, so no caller
   * re-decides it. Use `footer` instead for a foot that is not a decision.
   */
  actions?: Actions
  /** Anything in the foot that is NOT a cancel/confirm pair. Ignored when
   *  `actions` is given: a dialog has one foot. */
  footer?: ReactNode
}

/* `tabindex="-1"` means "focusable by script, not by Tab", and components use it
 * to park a control the keyboard should skip: SearchInput does it to the magnifier
 * once the field is open. The old list only excluded it on [tabindex], so a
 * parked <button> still counted, and it counted TWICE over: the dialog opened on
 * a control no one can reach with the keyboard, and the Tab trap wrapped around
 * an element the browser never visits. */
const NOT_PARKED = ':not([tabindex="-1"])'
const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]',
].map((s) => s + NOT_PARKED).join(', ')

/* The same list, narrowed to one region. A descendant selector has to be built
 * per branch, since a prefix cannot be applied to a comma-separated list. */
const within = (scope: string) => FOCUSABLE.split(',').map((s) => `${scope} ${s.trim()}`).join(', ')
const FOCUSABLE_IN_BODY = within('.modal-body')
const FOCUSABLE_IN_FOOTER = within('.modal-footer')

/* Module-level refcount + saved overflow value — so stacked modals share one
 * lock and the body's original overflow is correctly restored when the LAST
 * modal closes. */
let bodyLockRefs = 0
let prevBodyOverflow = ''
function acquireBodyLock() {
  if (bodyLockRefs === 0) {
    prevBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  bodyLockRefs++
}
function releaseBodyLock() {
  bodyLockRefs = Math.max(0, bodyLockRefs - 1)
  if (bodyLockRefs === 0) document.body.style.overflow = prevBodyOverflow
}

/**
 * Dialog in a portal: focus trap, ESC, body scroll lock and a foot for the
 * actions. `size` widens it, and `sm` is for a yes/no confirmation only — a
 * dialog that collects anything needs `md` or wider.
 *
 * ONE dialog, any content. A confirmation is this with a sentence in it; a form
 * is this with a <FormStack> of Fields in it. Both used to be blocks of their
 * own and neither carried behaviour, so both are now `actions` plus children.
 *
 * Copy: the title is the question or the job, not the widget — "Delete this
 * recording?", not "Confirmation". The confirm button repeats the verb
 * from the title, so a reader who skipped the sentence still knows what
 * the button does.
 */
export function Modal({
  open, onClose, title, size = 'md', placement = 'center', dismissible = true, className, children,
  actions, footer,
}: Props) {
  const { t } = useTranslation()
  const dialogRef = useRef<HTMLDivElement>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)
  const titleId = useId()

  /* Keep onClose/dismissible in refs so the focus effect depends ONLY on `open`.
   * Consumers pass an inline onClose (new identity each render); if it were an effect
   * dep, every keystroke-driven re-render would re-run the effect and steal focus back
   * to the first element (the close button), making inputs impossible to type in. */
  const onCloseRef = useLatest(onClose)
  const dismissibleRef = useLatest(dismissible)

  /* Focus management: trap inside, return focus on close. Runs once per open. */
  useEffect(() => {
    if (!open) return
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null
    const node = dialogRef.current
    /* Where a dialog opens, in order of what it means.
     *
     * 1. What the CONTENT asks for. `[autofocus]` is included so the React
     *    `autoFocus` prop means here what its users already believed.
     * 2. Otherwise the first control in the BODY, then in the footer.
     * 3. Only then the dialog itself (tabindex -1), which announces the title.
     *
     * The close button is deliberately unreachable by this search. It is first
     * in document order, so plain `querySelector(FOCUSABLE)` handed it the
     * focus in every dialog that did not opt out: the first thing a screen
     * reader announced was the way out, the first keystroke went nowhere, and
     * a focus ring sat on the X while the operator looked at the content. That
     * made correctness opt-in, and seven dialogs in one app had to remember
     * `data-autofocus` to get it. A dialog now opens on its work by default,
     * and the attribute is for choosing WHICH field, not for escaping a bad
     * default. */
    const wanted = node?.querySelector<HTMLElement>('[data-autofocus], [autofocus]')
    const inBody = node?.querySelector<HTMLElement>(FOCUSABLE_IN_BODY)
    const inFooter = node?.querySelector<HTMLElement>(FOCUSABLE_IN_FOOTER)
    const first = wanted ?? inBody ?? inFooter ?? node
    first?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissibleRef.current) { e.preventDefault(); onCloseRef.current(); return }
      if (e.key !== 'Tab' || !node) return
      const focusables = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE))
        .filter((el) => !el.hasAttribute('disabled'))
      if (focusables.length === 0) { e.preventDefault(); return }
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)

    /* Refcounted body-scroll lock — supports stacked modals. */
    acquireBodyLock()

    return () => {
      document.removeEventListener('keydown', onKey)
      releaseBodyLock()
      previouslyFocusedRef.current?.focus()
    }
  }, [open, onCloseRef, dismissibleRef])

  if (!open) return null

  return createPortal(
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- backdrop, not a control; click-to-dismiss while the dialog owns the role
    <div
      className="modal-overlay"
      data-placement={placement}
      onMouseDown={(e) => { if (dismissible && e.target === e.currentTarget) onClose() }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        /* Focusable as a last resort, so a dialog with no controls at all still
         * moves focus inside itself and announces its title. */
        tabIndex={-1}
        aria-labelledby={title ? titleId : undefined}
        className={cn('modal', className)} data-raised="popover"
        data-size={size}
        data-placement={placement}
      >
        {title && (
          <header className="modal-header">
            <h2 id={titleId} className="modal-title">{title}</h2>
            {dismissible && (
              <Tooltip content={t('a11y.close')}>
                <IconButton
                  icon="close"
                  size="md"
                  aria-label={t('a11y.close')}
                  onClick={onClose}
                />
              </Tooltip>
            )}
          </header>
        )}
        <div className="modal-body">{children}</div>
        {/* One foot. `actions` is the decision row and wins, because a dialog
            that asks a question and also carries a loose footer is asking two. */}
        {actions ? (
          <div className="modal-footer">
            <Button variant="ghost" onClick={onClose}>
              {actions.cancelLabel ?? t('modal.cancel')}
            </Button>
            <Button
              variant={actions.tone ?? 'primary'}
              onClick={actions.onConfirm}
              loading={actions.busy}
              disabled={actions.confirmDisabled}
            >
              {actions.confirmLabel ?? t('modal.confirm')}
            </Button>
          </div>
        ) : (
          footer && <div className="modal-footer">{footer}</div>
        )}
      </div>
    </div>,
    document.body,
  )
}
