/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Accordion } from './Accordion'
import { SectionLabel } from '../SectionLabel'
import { Stack } from '../Layout'

/* AN ACCORDION HIDES THINGS, WHICH IS THE POINT AND ALSO THE RISK. Reach for it
 * when the reader wants ONE of the panels and the rest are noise — questions
 * they might have, settings they might change. Never for content they are meant
 * to read: collapsed text is text most people never see, and a page that hides
 * what it is about is a page that reads as empty.
 *
 * `multiple` is about how the panels RELATE. Left closed, one at a time is the
 * honest default — opening the next closes the last, so the reader is never
 * scrolling a wall they did not ask for. Turn it on when panels are meant to be
 * COMPARED, or when a reader works through them in order and closing the one
 * behind them loses their place.
 *
 * `headingLevel` FOLLOWS THE OUTLINE, and every header is a real heading. A
 * stack of blocks straight under the page title is at 2, not the default 3, and
 * a skipped level is a section a screen reader user cannot walk to.
 *
 * `size` is the header's VOICE, not its importance: `md` reads as body text and
 * belongs inside a section; `lg` is the section-head size, for a column of
 * blocks whose titles are the headings of the page beside them.
 */
export function Example() {
  return (
    <Stack gap={8}>
      <Stack gap={3}>
        <SectionLabel as="h2">Delivery</SectionLabel>
        {/* Inside a section, so the headers sit one level below it and read at
            body size. One panel at a time: these are answers, not a comparison. */}
        <Accordion
          headingLevel={3}
          defaultOpen={['shipping']}
          items={[
            { id: 'shipping', title: 'Shipping', content: 'Ships in 2 to 4 business days across the GCC.' },
            { id: 'returns', title: 'Returns', content: 'Free returns within 30 days of delivery.' },
            { id: 'warranty', title: 'Warranty', content: 'One year manufacturer warranty on all items.' },
          ]}
        />
      </Stack>

      {/* The blocks ARE the page here, so they speak at section-head size and
          several stay open, because the reader is comparing them. */}
      <Accordion
        size="lg"
        headingLevel={2}
        multiple
        defaultOpen={['standard', 'express']}
        items={[
          { id: 'standard', title: 'Standard', content: '2 to 4 business days. Included in the price.' },
          { id: 'express', title: 'Express', content: 'Next business day. SAR 35 per order.' },
          { id: 'pickup', title: 'Collect in store', content: 'Ready within 2 hours at any branch.' },
        ]}
      />
    </Stack>
  )
}
