/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { Checkbox } from './Checkbox'
import { CheckboxGroup } from './CheckboxGroup'

const CHANNELS = [
  { value: 'email', label: 'Email' },
  { value: 'teams', label: 'Teams message' },
]

/* One box answers a yes/no question of its own; several boxes answering the
 * SAME question are a CheckboxGroup, which carries the group name a screen
 * reader announces before the first box. */
export function Example() {
  const [assigned, setAssigned] = useState(false)
  const [channels, setChannels] = useState(['email'])

  return (
    <>
      <Checkbox
        label="Email me when a review is assigned"
        checked={assigned}
        onChange={(e) => setAssigned(e.target.checked)}
      />
      <CheckboxGroup
        label="How should we reach you?"
        options={CHANNELS}
        value={channels}
        onChange={setChannels}
      />
    </>
  )
}
