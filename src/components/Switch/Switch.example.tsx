/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { Switch } from './Switch'

export function Example() {
  const [on, setOn] = useState(true)

  /* `label` is the accessible name, not a visible caption — pair the switch with
   * a <Label> or a <Field> when the screen needs visible text. */
  return <Switch checked={on} onChange={setOn} label="Weekly digest" />
}
