import { type Ref } from 'react'

/**
 * Fill our own ref AND whatever ref the caller already put on the element.
 *
 * `<Tooltip>` and `<HoverCard>` both inject handlers into their child with
 * `cloneElement`, which replaces the child's `ref`. Without composing, wrapping
 * an element in a Tooltip would silently break any ref the caller had on it, and
 * silently is the operative word: nothing type-checks it and nothing renders
 * differently. Both components had the same fifteen lines; this is them, once.
 *
 * React calls the returned callback during commit, never during render, so the
 * writes below are not render-phase mutation even though the compiler cannot
 * prove it from the call site.
 */
export function composeRefs<T>(...refs: (Ref<T> | undefined)[]) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === 'function') ref(node)
      /* Writing into the caller's own ref object is what forwarding a ref MEANS,
       * and taking it as a typed `Ref<T>` parameter rather than digging it out of
       * `children.props` is what makes that legible to the compiler too: inline in
       * the components it read as mutating a prop, here it plainly is not. */
      else if (ref && typeof ref === 'object') ref.current = node
    }
  }
}
