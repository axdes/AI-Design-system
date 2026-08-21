/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Accordion } from './Accordion'

export function Example() {
  /* One panel open at a time by default; pass `multiple` to allow several.
   * `defaultOpen` seeds the initial state by item id. */
  return (
    <Accordion
      defaultOpen={['shipping']}
      items={[
        { id: 'shipping', title: 'Shipping', content: 'Ships in 2 to 4 business days across the GCC.' },
        { id: 'returns', title: 'Returns', content: 'Free returns within 30 days of delivery.' },
        { id: 'warranty', title: 'Warranty', content: 'One year manufacturer warranty on all items.' },
      ]}
    />
  )
}
