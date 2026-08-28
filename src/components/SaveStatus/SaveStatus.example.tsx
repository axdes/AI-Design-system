/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { Field } from '../Field'
import { Input } from '../Input'
import { useAutosave } from '../../lib/useAutosave'
import { SaveStatus } from './SaveStatus'

export function Example() {
  const [title, setTitle] = useState('Community Outreach Newsletter')

  /* The pair, together, because neither is the whole answer: `useAutosave` owns
   * WHEN a draft is written (a pause in typing, once, not per keystroke) and
   * <SaveStatus> is the sentence that says it happened. A form that saves by
   * itself and never says so makes the user invent their own proof — they
   * retype a sentence, or they leave and hope. */
  const { state, savedAt } = useAutosave(title, async () => {
    await Promise.resolve()
  })

  return (
    <Field label="Title" htmlFor="draft-title">
      <Input id="draft-title" value={title} onChange={(e) => { setTitle(e.target.value) }} />
      {/* `idle` renders nothing, so the line does not reserve space before the
        * first change. A fixed instant keeps the visual baseline still. */}
      <SaveStatus state={state} at={savedAt ?? '2026-08-23T09:14:00.000Z'} />
    </Field>
  )
}
