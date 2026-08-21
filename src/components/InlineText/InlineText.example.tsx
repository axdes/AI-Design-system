/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { InlineText } from './InlineText'

export function Example() {
  const [title, setTitle] = useState('Untitled document')

  /* Click-to-edit text: renders as `as` until activated, then as an input.
   * `label` is the accessible name of that input. */
  return <InlineText as="h2" value={title} label="Document title" onSave={setTitle} />
}
