/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Breadcrumb } from './Breadcrumb'

export function Example() {
  /* The trail back up the hierarchy. The last item is the current page and
   * renders as plain text, not a link — pass href or onSelect for the rest. */
  return (
    <Breadcrumb
      items={[
        { label: 'Library', onSelect: () => undefined },
        { label: 'Reports', onSelect: () => undefined },
        { label: 'Q3 revenue' },
      ]}
    />
  )
}
