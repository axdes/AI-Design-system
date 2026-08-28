import { useCallback, useEffect, useRef, useState } from 'react'
import { useLatest } from './useLatest'

export type SaveState = 'idle' | 'saving' | 'saved' | 'error'

type Options = {
  /** Quiet period after the last change before a save is attempted. */
  delay?: number
  /** Off while the form is not editable, or while a required field is empty. */
  enabled?: boolean
}

/**
 * The draft form's save model in one place: wait for a pause in typing, save
 * once, and report what happened so `<SaveStatus>` can say it.
 *
 * Why a pause and not every keystroke: a save per character is a save per
 * character on the server too, and the user cannot tell a slow network from a
 * lost sentence. Why not on submit: a draft form has no submit, which is the
 * point of it.
 *
 * @public Called by consuming apps: the draft-form save model lives here so no
 * product invents its own timing. Nothing inside this package autosaves yet.
 *
 * `save` is read through a ref, so a consumer passing an inline closure (which
 * is every consumer) does not restart the timer on every render. The value is
 * the dependency, because the value is what a save is FOR.
 */
export function useAutosave<T>(value: T, save: (value: T) => Promise<void> | void, { delay = 1200, enabled = true }: Options = {}) {
  const [state, setState] = useState<SaveState>('idle')
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const saveRef = useLatest(save)
  /* The first render is not a change: without this, opening a form saves it. */
  const initial = useRef(value)
  const run = useCallback(
    async (next: T) => {
      setState('saving')
      try {
        await saveRef.current(next)
        setState('saved')
        setSavedAt(new Date())
      } catch {
        /* The state is the report; the caller's own error handling belongs in
         * `save`, and the value stays in the form either way. */
        setState('error')
      }
    },
    [saveRef],
  )

  useEffect(() => {
    if (!enabled || value === initial.current) return
    const id = window.setTimeout(() => { void run(value) }, delay)
    return () => { window.clearTimeout(id) }
  }, [value, delay, enabled, run])

  /* For the control that cannot wait for the timer: a blur, or a Cmd+S. */
  const saveNow = useCallback(() => run(value), [run, value])

  return { state, savedAt, saveNow }
}
