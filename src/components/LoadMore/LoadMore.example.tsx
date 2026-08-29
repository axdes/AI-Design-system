/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { LoadMore } from './LoadMore'
import { ListItem } from '../ListItem'
import { Stack } from '../Layout'

const PAGE = 3
const TOTAL = 9

/* THE END OF A FEED IS QUIET. With `hasMore` false this renders NOTHING — not a
 * disabled button, not "no more results" — because a control that cannot be
 * used is a control the reader still has to read and dismiss.
 *
 * `auto` IS THE DECISION, and it is about whether the reader is BROWSING or
 * LOOKING FOR SOMETHING. Left off, the button is a press, which is right when
 * the page has a footer, when each page costs real money or time, or when the
 * reader may want to stop. Turned on, the next page loads as the end comes into
 * view, which suits a feed nobody expects to reach the bottom of — and takes
 * the footer away from everyone, because it keeps retreating.
 *
 * `loading` comes from the caller because only the caller knows when the fetch
 * is done. While it is true the label becomes `loadingLabel` and the control
 * cannot be pressed twice.
 */
export function Example() {
  const [shown, setShown] = useState(PAGE)

  return (
    <Stack gap={1}>
      {Array.from({ length: shown }, (_, i) => (
        <ListItem key={i}>Update {i + 1}</ListItem>
      ))}
      <LoadMore
        hasMore={shown < TOTAL}
        label="Load more"
        onLoad={() => { setShown((n) => n + PAGE) }}
      />
    </Stack>
  )
}
