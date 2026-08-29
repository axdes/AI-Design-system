/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { SidePanel } from './SidePanel'
import { Button } from '../Button'
import { Field } from '../Field'
import { Input } from '../Input'
import { Row } from '../Layout'
import { ListItem } from '../ListItem'
import { Stack } from '../Layout'

/* Header with the title and the close, a body that scrolls, a footer pinned to
 * the bottom so the actions never scroll away from the fields they submit. The
 * outer width, border and radius belong to whoever places it.
 *
 * `hideBelow` IS THE ONE DECISION HERE, and it turns on what the panel IS.
 *
 * A panel carrying CONTENT — a form the reader came to fill, the record they
 * opened — has no `hideBelow`. Dropping it on a phone takes the task away, and
 * the reader has no other route to it. It wraps under the main column instead.
 *
 * A panel that is a WIDE-SCREEN CONVENIENCE — a table of contents, an outline,
 * a preview of what is selected — sets it. Wrapped under an article on a phone,
 * a table of contents points only at things the reader has already scrolled
 * past, which the page audit reads as a dead column (2026-08-26). Better gone
 * than repeated.
 *
 * The same word and the same two steps as `<Th hideBelow>`, so a table column
 * and a panel disappear at the same width rather than at two answers to the
 * same question.
 */
export function Example() {
  return (
    <Row gap={6} align="start">
      <SidePanel
        title="Request leave"
        onClose={() => undefined}
        footer={
          <>
            <Button>Submit</Button>
            <Button variant="secondary">Cancel</Button>
          </>
        }
      >
        <Field label="Dates" htmlFor="dates">
          <Input id="dates" placeholder="DD.MM.YYYY - DD.MM.YYYY" />
        </Field>
      </SidePanel>

      {/* Nothing here is unreachable without it, so on a phone it goes. */}
      <SidePanel title="On this page" hideBelow="md">
        <Stack gap={1}>
          <ListItem onClick={() => undefined}>Eligibility</ListItem>
          <ListItem onClick={() => undefined}>How much you accrue</ListItem>
          <ListItem onClick={() => undefined}>Carrying days over</ListItem>
        </Stack>
      </SidePanel>
    </Row>
  )
}
