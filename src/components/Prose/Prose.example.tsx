/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Prose } from './Prose'

export function Example() {
  /* The default is muted, because prose on a screen is almost always context
     around the thing the reader came for. `appearance="plain"` is for the case
     where the sentence IS the content. */
  return (
    <Prose>
      A queue is worked through rather than searched, so it carries no filter
      bar: the set is <strong>given</strong>, and what it needs is density and
      status.
    </Prose>
  )
}
