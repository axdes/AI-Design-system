/* Reference solution — what "used the design system" looks like for this task.
 * Doubles as a regression fixture: the scorers must give it a perfect score. */
import { useState } from 'react'
import { Combobox } from '@/components/Combobox'
import { Field } from '@/components/Field'
import { Stack } from '@/components/Layout'

type Country = 'sa' | 'ae' | 'eg' | 'jo' | 'kw' | 'qa' | 'bh' | 'om'

const COUNTRIES: { value: Country; label: string }[] = [
  { value: 'sa', label: 'Saudi Arabia' },
  { value: 'ae', label: 'United Arab Emirates' },
  { value: 'eg', label: 'Egypt' },
  { value: 'jo', label: 'Jordan' },
  { value: 'kw', label: 'Kuwait' },
  { value: 'qa', label: 'Qatar' },
  { value: 'bh', label: 'Bahrain' },
  { value: 'om', label: 'Oman' },
]

export function Screen() {
  const [country, setCountry] = useState<Country>()

  return (
    <Stack gap={4}>
      <Field label="Country" htmlFor="country" required>
        <Combobox<Country>
          label="Country"
          placeholder="Type to search"
          emptyLabel="No country matches"
          options={COUNTRIES}
          value={country}
          onChange={setCountry}
        />
      </Field>
    </Stack>
  )
}
