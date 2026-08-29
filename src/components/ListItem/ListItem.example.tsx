/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { ListItem } from './ListItem'
import { Card } from '../Card'
import { MetaItem } from '../MetaItem'
import { Row, Stack } from '../Layout'

/* THE WHOLE ROW IS THE BUTTON. It renders a real `<button>`, so the hit area is
 * the row and not the words in it, the keyboard reaches it in order, and Enter
 * works without anything being wired up. That is the decision this component
 * makes: a row the reader can ACT on.
 *
 * A row they only read is not this. A list of facts is a <Stack> of <Row>s, and
 * dressing it as a ListItem promises a click that never happens — which is
 * worse than plain text, because the reader tries.
 *
 * A row with its OWN controls in it is not this either: a button inside a
 * button is invalid, and a trailing action needs the row to be a div with its
 * own affordance rather than one big control.
 *
 * The row's INSIDE is yours. ListItem supplies the hit area, the marker and
 * the states; the title and its provenance are a <Row> like anywhere else, and
 * the meta is a <MetaItem> — a bare <span> after a <strong> renders with no
 * space between them, because nothing was asked to lay them out.
 *
 * `icon` is ONE MARKER FOR THE WHOLE LIST — it says what kind of thing these
 * rows are, so it is the same on every row. A different icon per row turns the
 * marker into decoration and the reader starts trying to read meaning into it.
 */
export function Example() {
  const files = [
    { id: 'a', name: 'Q3 delivery review', meta: 'Edited 2 days ago' },
    { id: 'b', name: 'Onboarding checklist', meta: 'Edited last week' },
    { id: 'c', name: 'Incident postmortem', meta: 'Edited in March' },
  ]

  return (
    <Card>
      <Stack gap={1}>
        {files.map((file) => (
          <ListItem key={file.id} icon="description" onClick={() => undefined}>
            <Row gap={3} align="center" justify="between">
              <strong>{file.name}</strong>
              <MetaItem icon="schedule">{file.meta}</MetaItem>
            </Row>
          </ListItem>
        ))}
      </Stack>
    </Card>
  )
}
