/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { PageHeader } from './PageHeader'
import { Button } from '../Button'
import { Icon } from '../Icon'

export function Example() {
  /* Page chrome comes from the header, not from hand-rolled markup: title,
   * optional back affordance, and the action cluster on the inline end. */
  return (
    <PageHeader
      title="Content library"
      actions={<Button variant="primary" iconEnd>New document<Icon name="add" /></Button>}
    />
  )
}
