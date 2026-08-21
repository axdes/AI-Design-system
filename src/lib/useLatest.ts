import { useEffect, useRef, type RefObject } from 'react'

/**
 * A ref that always holds the most recent value, for reading from a callback
 * that outlives the render which created it.
 *
 * The problem it solves: an effect that must NOT re-run when a prop's identity
 * changes. `<Modal>`'s focus trap depends only on `open`, because consumers pass
 * an inline `onClose` with a new identity every render, and listing it as a
 * dependency made every keystroke re-run the effect and yank focus back to the
 * close button. The fix is to read `onClose` through a ref instead.
 *
 * Why a hook rather than `ref.current = value` in the component body: that is an
 * assignment during render, which React's compiler rules reject and rightly so.
 * Render must be pure, and under concurrent rendering a render that is thrown
 * away would still have written to the ref. Assigning in an effect happens after
 * the commit, so only a render that actually landed updates it.
 *
 * The trade-off, and the reason this is not a blanket replacement: between the
 * render and the effect, `ref.current` still holds the PREVIOUS value. That is
 * fine for a callback fired later by a keypress, a timeout or a subscription,
 * which is every use here. It is wrong for anything read synchronously during
 * the same commit; use the value itself there.
 */
export function useLatest<T>(value: T): RefObject<T> {
  const ref = useRef(value)
  useEffect(() => {
    ref.current = value
  })
  return ref
}
