/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { LoadMore } from './LoadMore'
import { ListItem } from '../ListItem'
import { Stack } from '../Layout'

const PAGE = 3
const TOTAL = 9

export function Example() {
  const [shown, setShown] = useState(PAGE)
  return (
    <Stack gap={1}>
      {Array.from({ length: shown }, (_, i) => (
        <ListItem key={i}>Update {i + 1}</ListItem>
      ))}
      {/* hasMore false renders nothing at all, so the end of the feed is quiet. */}
      <LoadMore
        hasMore={shown < TOTAL}
        label="Load more"
        onLoad={() => { setShown((n) => n + PAGE) }}
      />
    </Stack>
  )
}
