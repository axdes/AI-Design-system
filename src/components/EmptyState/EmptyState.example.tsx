/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { EmptyState } from './EmptyState'
import { Button } from '../Button'
import { Icon } from '../Icon'

export function Example() {
  return (
    <EmptyState
      icon="folder"
      title="No documents yet"
      description="Upload a file or create one from a template."
      as="h2"
      action={<Button variant="primary" iconEnd>New document<Icon name="add" /></Button>}
    />
  )
}
