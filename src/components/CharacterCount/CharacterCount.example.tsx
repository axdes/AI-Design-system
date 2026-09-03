/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { CharacterCount } from './CharacterCount'
import { Field } from '../Field'
import { Textarea } from '../Textarea'

const MAX = 140

export function Example() {
  const [summary, setSummary] = useState('One line on what the team is building.')

  /* No `maxLength` on the control: a field that silently stops accepting keys
   * leaves the user unsure whether the text was cut, so the limit is stated and
   * the submit is what enforces it. */
  return (
    <Field
      label="Summary"
      htmlFor="summary"
      hint="Shown in the team list."
      counter={<CharacterCount value={summary} max={MAX} />}
    >
      <Textarea
        id="summary"
        rows={3}
        value={summary}
        invalid={summary.length > MAX}
        onChange={(e) => setSummary(e.target.value)}
      />
    </Field>
  )
}
