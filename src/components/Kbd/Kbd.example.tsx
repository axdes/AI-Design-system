/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Kbd } from './Kbd'

export function Example() {
  /* One Kbd per key; the "+" between them is plain text. This is the hint that
   * sits next to a CommandPalette trigger or in a shortcuts help sheet. */
  return (
    <p>
      Press <Kbd>Ctrl</Kbd>+<Kbd>K</Kbd> to open the command palette.
    </p>
  )
}
