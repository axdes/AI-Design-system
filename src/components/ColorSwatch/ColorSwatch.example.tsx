/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { ColorSwatch } from './ColorSwatch'
import { Row } from '../Layout'

/* A curated set, which is what this part is for: someone chose these, and the
 * person picking is choosing between them rather than mixing their own. The
 * label is the colour's NAME — a hex code is the value, and the value is
 * already the value. The white one is why the dot draws its own edge. */
const BRAND = [
  { value: '#4638d3', label: 'Indigo' },
  { value: '#0f766e', label: 'Teal' },
  { value: '#ffffff', label: 'Paper' },
]

export function Example() {
  const [brand, setBrand] = useState(BRAND[0].value)
  return (
    <Row gap={2}>
      {BRAND.map((b) => (
        <ColorSwatch
          key={b.value}
          value={b.value}
          label={b.label}
          selected={brand === b.value}
          onSelect={setBrand}
        />
      ))}
    </Row>
  )
}
