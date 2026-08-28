/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { LogoWall } from './LogoWall'

/* Inline SVG data URIs so the example needs no assets: what matters here is
 * that two marks of different weight end up reading at the same strength. */
const mark = (text: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="32"><text x="0" y="24" font-family="sans-serif" font-size="22" font-weight="700">${text}</text></svg>`,
  )}`

const CUSTOMERS = [
  { src: mark('Northwind'), alt: 'Northwind' },
  { src: mark('Contoso'), alt: 'Contoso' },
  { src: mark('Fabrikam'), alt: 'Fabrikam' },
  { src: mark('Tailspin'), alt: 'Tailspin' },
]

export function Example() {
  return <LogoWall logos={CUSTOMERS} label="Customers" />
}
