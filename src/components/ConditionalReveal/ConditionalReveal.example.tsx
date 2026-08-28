/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { ConditionalReveal } from './ConditionalReveal'
import { Field } from '../Field'
import { Input } from '../Input'
import { Radio } from '../Radio'
import { Stack } from '../Layout'

export function Example() {
  const [reason, setReason] = useState('scope')
  const [other, setOther] = useState('')

  /* The reveal sits under the option it belongs to, not at the end of the
   * group: read in order, "Something else" is immediately followed by the field
   * that finishes the sentence. */
  return (
    /* A Stack, not a bare <div>: `Radio` is inline-flex, so a hand-rolled
       container gives the options no gap at all and they touch (owner,
       2026-08-24). The group is hand-composed rather than a `RadioGroup`
       because the reveal belongs UNDER one option, not after the set. */
    <Stack gap={2} role="radiogroup" aria-label="Why is the session moving?">
      <Radio
        name="reason"
        value="scope"
        label="The scope changed"
        checked={reason === 'scope'}
        onChange={() => setReason('scope')}
      />
      <Radio
        name="reason"
        value="other"
        label="Something else"
        checked={reason === 'other'}
        onChange={() => setReason('other')}
      />
      <ConditionalReveal when={reason === 'other'}>
        <Field label="What happened?" htmlFor="reason-other">
          <Input id="reason-other" value={other} onChange={(e) => setOther(e.target.value)} />
        </Field>
      </ConditionalReveal>
    </Stack>
  )
}
