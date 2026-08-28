import { useCallback, useSyncExternalStore } from 'react'

/**
 * Subscribe to a CSS media query. Returns whether it currently matches.
 *
 * `useSyncExternalStore` rather than state plus an effect, because that is what
 * this is: a value that lives outside React and changes without React being
 * told. The effect version seeded state from `matchMedia` and then set it again
 * on mount, which is a second render on every component that asks — and the
 * render in between held a value read before the subscription existed, which is
 * the tearing this hook is meant to prevent (2026-08-28).
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    [query],
  )

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    /* Server snapshot: no window, so nothing matches. The components that ask
       are the ones that widen a layout, and the narrow arrangement is the one
       that is correct when nothing is known. */
    () => false,
  )
}
