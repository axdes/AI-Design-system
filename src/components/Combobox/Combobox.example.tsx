/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { Combobox } from './Combobox'
import { Field } from '../Field'

type Country = 'sa' | 'ae' | 'eg' | 'jo' | 'kw'

const COUNTRIES: { value: Country; label: string }[] = [
  { value: 'sa', label: 'Saudi Arabia' },
  { value: 'ae', label: 'United Arab Emirates' },
  { value: 'eg', label: 'Egypt' },
  { value: 'jo', label: 'Jordan' },
  { value: 'kw', label: 'Kuwait' },
]

export function Example() {
  const [country, setCountry] = useState<Country>()

  /* Reach for Combobox over Select when the list is long enough to want typing.
   * Wrap it in a <Field> for the visible label; `label` here is the input's
   * accessible name. */
  return (
    <Field label="Country" htmlFor="country">
      <Combobox<Country>
        label="Country"
        placeholder="Type to search"
        options={COUNTRIES}
        value={country}
        onChange={setCountry}
      />
    </Field>
  )
}
