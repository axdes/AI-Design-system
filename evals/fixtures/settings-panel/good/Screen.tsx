/* Reference solution — what "used the design system" looks like for this task.
 * Doubles as a regression fixture: the scorers must give it a perfect score. */
import { useState } from 'react'
import { Divider } from '@/components/Divider'
import { Field } from '@/components/Field'
import { Input } from '@/components/Input'
import { NumberInput } from '@/components/NumberInput'
import { SegmentedControl } from '@/components/SegmentedControl'
import { SectionLabel } from '@/components/SectionLabel'
import { Slider } from '@/components/Slider'
import { Stack } from '@/components/Layout'
import { Switch } from '@/components/Switch'

type Density = 'compact' | 'normal' | 'detailed'

export function Screen() {
  const [address, setAddress] = useState('team@example.com')
  const [digest, setDigest] = useState(true)
  const [density, setDensity] = useState<Density>('normal')
  const [keepDays, setKeepDays] = useState(30)
  const [quietFrom, setQuietFrom] = useState(22)

  return (
    <Stack gap={6}>
      <SectionLabel>Delivery</SectionLabel>

      {/* Input does not name itself, so it gets a Field. The controls below do
        * carry their own label prop, and wrapping those in a Field too would
        * announce every one of them twice. */}
      <Field label="Send digests to" htmlFor="digest-address">
        <Input
          id="digest-address"
          type="email"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </Field>

      <Switch checked={digest} onChange={setDigest} label="Weekly digest" />

      <SegmentedControl<Density>
        label="Digest density"
        value={density}
        onChange={setDensity}
        options={[
          { value: 'compact', label: 'Compact' },
          { value: 'normal', label: 'Normal' },
          { value: 'detailed', label: 'Detailed' },
        ]}
      />

      <Slider
        label="Quiet hours start"
        value={quietFrom}
        onChange={setQuietFrom}
        min={18}
        max={23}
        step={1}
        showValue
        formatValue={(v) => `${v}:00`}
      />

      <Divider />

      <SectionLabel>Retention</SectionLabel>

      <NumberInput
        label="Keep read notifications for (days)"
        value={keepDays}
        onChange={setKeepDays}
        min={1}
        max={365}
        step={1}
      />
    </Stack>
  )
}
