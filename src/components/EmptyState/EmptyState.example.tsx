/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { EmptyState } from './EmptyState'
import { Button } from '../Button'
import { Icon } from '../Icon'
import { Stack } from '../Layout'

/* NOTHING-YET AND NOTHING-MATCHES ARE TWO DIFFERENT SCREENS, and using one for
 * both is the mistake this component exists to stop. A collection with no records
 * needs a way in — the action is the point. A filter that matched nothing already
 * has its records; offering "create one" there answers a question nobody asked,
 * and the way out is to widen the filter.
 *
 * `surface` follows where it stands: `page` for a whole screen with nothing on it,
 * `card` for the hole inside a panel or a list that has one. `size` follows the
 * same thing — a full page can afford the large mark, a card cannot.
 *
 * `as` is the heading level, and it is the page's outline, not a size: `h2` under
 * a page title, never skipping a level to get a bigger word.
 */
export function Example() {
  return (
    <Stack gap={6}>
      <EmptyState
        icon="folder"
        title="No documents yet"
        description="Upload a file or create one from a template."
        as="h2"
        size="lg"
        surface="page"
        action={<Button variant="primary">New document<Icon name="add" /></Button>}
      />
      <EmptyState
        icon="search"
        title="Nothing matches “invoice”"
        description="Try a shorter word, or clear the status filter."
        as="h3"
        size="sm"
        surface="card"
        action={<Button variant="secondary">Clear filters</Button>}
      />
    </Stack>
  )
}
