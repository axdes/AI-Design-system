/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { CardTitle, CardMeta } from '../Card'
import { MetaItem } from '../MetaItem'
import { CardStack } from './CardStack'

const QUEUE = [
  { id: 'a', title: 'Site 14, working at height', waiting: 'Oldest waiting 6 days' },
  { id: 'b', title: 'Site 9, ladder inspection', waiting: 'Waiting 4 days' },
  { id: 'c', title: 'Site 3, scaffold sign-off', waiting: 'Waiting 2 days' },
]

/* One topic, twelve instances: the topic keeps its slot on the overview and the
 * instances go behind it. The caller owns which one is on top — the same
 * arrangement as <Tabs> — so `onNext` moves the index and the pile shows the
 * next card. The label is what a screen reader gets; the layering says nothing
 * out loud. */
export function Example() {
  const [at, setAt] = useState(0)
  const top = QUEUE[at % QUEUE.length]
  return (
    <CardStack
      count={12}
      label="12 audits waiting on you"
      onOpen={() => undefined}
      onNext={() => setAt((i) => i + 1)}
      nextLabel="Skip"
      openLabel="Open"
    >
      <CardTitle>{top.title}</CardTitle>
      <CardMeta>
        <MetaItem icon="schedule">{top.waiting}</MetaItem>
      </CardMeta>
    </CardStack>
  )
}
