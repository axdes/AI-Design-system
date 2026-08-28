/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { BrandMark } from './BrandMark'
import { Logo } from '../../shell/Logo'

export function Example() {
  /* What a product passes as <SideNav logoMark>: the mark in the cap, drawn in
     inverse ink because it now sits on a brand fill. Hovering the collapsed
     rail's logo cross-fades it to the arrow that opens the rail. */
  return <BrandMark><Logo size={22} tone="inverse" /></BrandMark>
}
