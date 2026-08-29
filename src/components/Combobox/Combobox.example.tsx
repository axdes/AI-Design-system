/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { Combobox } from './Combobox'
import { Card } from '../Card'
import { Field } from '../Field'
import { Stack } from '../Layout'

type Country = 'sa' | 'ae' | 'eg' | 'jo' | 'kw'

const COUNTRIES: { value: Country; label: string }[] = [
  { value: 'sa', label: 'Saudi Arabia' },
  { value: 'ae', label: 'United Arab Emirates' },
  { value: 'eg', label: 'Egypt' },
  { value: 'jo', label: 'Jordan' },
  { value: 'kw', label: 'Kuwait' },
]

const TAGS = [
  { value: 'design', label: 'Design' },
  { value: 'research', label: 'Research' },
  { value: 'delivery', label: 'Delivery' },
]

/* COMBOBOX WHEN TYPING BEATS SCROLLING. Under about seven options the reader
 * can see them all and a <Select> is fewer moving parts; past that, and
 * especially when they already KNOW the answer, typing three letters beats
 * hunting a list. A free-text box with no options behind it is an <Input>.
 *
 * `multiple` changes what the control IS, not how it looks: one value that
 * replaces itself, or a set the reader adds to and removes from. Picking it
 * because "they might want several" gives every reader a chip list to manage
 * for a question with one answer.
 *
 * `surface` NAMES WHAT IS BEHIND THE CONTROL. On a `--muted` ground the white
 * fill already separates it, so the resting border comes off; on a card the
 * surface is white too, so `base` keeps the border that does the separating.
 */
export function Example() {
  const [country, setCountry] = useState<Country>()
  const [tags, setTags] = useState<string[]>(['design'])

  return (
    <Stack gap={6}>
      {/* On the page's muted ground. */}
      <Field label="Country" htmlFor="country">
        <Combobox<Country>
          label="Country"
          surface="muted"
          placeholder="Type to search"
          options={COUNTRIES}
          value={country}
          onChange={setCountry}
        />
      </Field>

      {/* On a card, and a question with more than one answer. */}
      <Card>
        <Field label="Topics" htmlFor="topics">
          <Combobox
            label="Topics"
            multiple
            placeholder="Add a topic"
            options={TAGS}
            value={tags}
            onChange={setTags}
          />
        </Field>
      </Card>
    </Stack>
  )
}
