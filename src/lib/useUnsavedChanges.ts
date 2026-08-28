import { useEffect } from 'react'

/**
 * The guard an explicit-save form owes: while it is dirty, closing the tab or
 * reloading asks first.
 *
 * Scope is deliberately the browser event only. In-app navigation is the
 * router's business and every app routes differently, so the app blocks its own
 * route change (React Router's `useBlocker`) and calls this for the part no
 * router can see.
 *
 * The message is the browser's own: since 2016 no engine renders a custom one,
 * and pretending otherwise produces a string nobody ever reads.
 */
export function useUnsavedChanges(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      /* Legacy engines need the assignment to trigger the prompt at all. */
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])
}
