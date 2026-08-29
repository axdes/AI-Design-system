/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { ColorSwatch } from './ColorSwatch'
import { Row, Stack } from '../Layout'
import { SectionLabel } from '../SectionLabel'

/* A curated set, which is what this part is for: someone chose these, and the
 * person picking is choosing between them rather than mixing their own. Give
 * them a free colour and this is the wrong control — that is a colour input,
 * and it belongs to a design tool, not to a product screen.
 *
 * `label` IS THE COLOUR'S NAME, not its value. "Indigo" is what a person says
 * and what a screen reader has to read out; the hex is already in `value`, and
 * announcing "#4638d3" tells nobody anything. The white one is in this set on
 * purpose: it is why the dot draws its own edge instead of trusting the fill.
 *
 * `size` follows how the set is used: `md` when picking is the task, `sm` for a
 * row of swatches read as a summary of what is already chosen.
 */
const BRAND = [
  { value: '#4638d3', label: 'Indigo' },
  { value: '#0f766e', label: 'Teal' },
  { value: '#ffffff', label: 'Paper' },
]

export function Example() {
  const [brand, setBrand] = useState(BRAND[0].value)
  const [accent, setAccent] = useState(BRAND[1].value)

  return (
    <Stack gap={6}>
      <Stack gap={2}>
        <SectionLabel as="h3">Brand colour</SectionLabel>
        <Row gap={2}>
          {BRAND.map((b) => (
            <ColorSwatch key={b.value} value={b.value} label={b.label} selected={brand === b.value} onSelect={setBrand} />
          ))}
        </Row>
      </Stack>

      {/* Smaller, because here the row is read rather than worked. */}
      <Stack gap={2}>
        <SectionLabel as="h3">Accent</SectionLabel>
        <Row gap={2}>
          {BRAND.map((b) => (
            <ColorSwatch key={b.value} size="sm" value={b.value} label={b.label} selected={accent === b.value} onSelect={setAccent} />
          ))}
        </Row>
      </Stack>
    </Stack>
  )
}
