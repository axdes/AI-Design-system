/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { LogoWall } from './LogoWall'
import { Card } from '../Card'
import { Stack } from '../Layout'
import { SectionLabel } from '../SectionLabel'

/* Inline SVG data URIs so the example needs no assets: what matters here is
 * that two marks of different weight end up reading at the same strength. */
const mark = (text: string, weight = 700, fill = '#1f2328') =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="32"><text x="0" y="24" font-family="sans-serif" font-size="22" font-weight="${weight}" fill="${fill}">${text}</text></svg>`,
  )}`

/* Four marks that arrive at different weights and different brand colours,
   which is what a real wall of logos is and what the levelling is for. */
const CUSTOMERS = [
  { src: mark('Northwind', 700, '#0f766e'), alt: 'Northwind' },
  { src: mark('Contoso', 400, '#b91c1c'), alt: 'Contoso' },
  { src: mark('Fabrikam', 700, '#1d4ed8'), alt: 'Fabrikam' },
  { src: mark('Tailspin', 400, '#a16207'), alt: 'Tailspin' },
]

/* A ROW OF MARKS THAT NOBODY READS ONE BY ONE. It says "these people use it",
 * and the reader takes it in as one thing — which is why the component levels
 * them: logos arrive at every weight and colour, and left alone the boldest one
 * becomes the message.
 *
 * `colour` is the decision, and it is about WHAT THE ROW IS FOR. Off is the
 * default and the right answer for a wall of proof: one ink, so no brand
 * outshouts another and none of them competes with the page's own. Turn it on
 * only where a specific brand is the subject — a partner page, a single
 * integration — and then it usually wants one or two marks, not a wall.
 *
 * `size` follows how much the row is carrying: `md` when the wall is a section
 * of its own, `sm` when it sits under a heading as supporting evidence.
 *
 * `alt` is the company's name on every mark. A logo with an empty alt is a
 * missing name, and the row is exactly a list of names.
 */
export function Example() {
  return (
    <Stack gap={6}>
      <Card>
        <Stack gap={3}>
          <SectionLabel as="h3">Trusted by</SectionLabel>
          {/* One ink, so the row reads as one statement. */}
          <LogoWall logos={CUSTOMERS} label="Customers" />
        </Stack>
      </Card>

      <Card>
        <Stack gap={3}>
          <SectionLabel as="h3">Featured partner</SectionLabel>
          {/* The brand IS the subject here, so it keeps its own colour. */}
          <LogoWall logos={CUSTOMERS.slice(0, 2)} colour size="sm" label="Featured partners" />
        </Stack>
      </Card>
    </Stack>
  )
}
