/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Code } from './Code'
import { Prose } from '../Prose'

const SOURCE = `<Page archetype="list" header={<PageHeader title="Approvals" />}>
  <Card flush>{rows}</Card>
</Page>`

export function Example() {
  /* A block owes a name: it scrolls, so a keyboard lands in it and has to be
     told where. Inline needs none — it is part of the sentence. */
  return (
    <>
      <Prose>
        The list archetype is carried by <Code inline>ListPageTemplate</Code>.
      </Prose>
      <Code label="A list page">{SOURCE}</Code>
    </>
  )
}
