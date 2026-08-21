/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Highlight } from './Highlight'
import { ListItem } from '../ListItem'
import { Stack } from '../Layout'

const QUERY = 'onboard'
const RESULTS = [
  'Onboarding checklist for new coaches',
  'How we onboard a delivery team',
]

/* One place a search result differs from a list row: it has to show why it
 * matched. Everything else stays the ordinary row component. */
export function Example() {
  return (
    <Stack gap={1}>
      {RESULTS.map((title) => (
        <ListItem key={title}><Highlight text={title} query={QUERY} /></ListItem>
      ))}
    </Stack>
  )
}
